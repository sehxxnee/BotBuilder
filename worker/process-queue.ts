//Next.js 서버와 별도로 동작하는 비동기 워커 프로세스  -> 무한 루프 로직
import { prisma } from '../src/server/db';
import { downloadFileAsBuffer } from '../src/server/infrastructure/r2/client';
import { createEmbedding } from '../src/server/infrastructure/llm/groq';
import { createRedisClient } from '../src/server/infrastructure/redis/client';

// Worker 전용 Redis 클라이언트 생성 (서버와 독립적으로 동작)
// 자동 연결을 위해 lazyConnect 옵션 없음
const redis = createRedisClient();  

const QUEUE_NAME = 'embedding_queue';
const DELAYED_SET = 'embedding_queue_delayed';
const DLQ_NAME = 'embedding_queue_dlq';

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 2000; // 2s
const BACKOFF_FACTOR = 2;   // 2x 지수 백오프

// 메트릭 키
const METRIC_PROCESSED = 'metrics:worker:processed_total';
const METRIC_FAILED = 'metrics:worker:failed_total';
const METRIC_RETRIED = 'metrics:worker:retried_total';

// 청크 크기 설정 (토큰 기준으로 약 500자, 겹치는 부분 50자)
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

// 벡터 차원: KBChunk 모델의 embedding은 vector(1536)이지만,
// 현재 createEmbedding이 768 차원을 반환하므로 여기서 맞춰야 함
// TODO: 실제 임베딩 API 사용 시 차원을 1536으로 변경 필요

/**
 * 텍스트를 의미 있는 청크로 분할
 * 간단한 문장 단위 분할을 사용 (향후 LangChain.js 등으로 개선 가능)
 */
function splitTextIntoChunks(text: string): string[] {
    if (!text || text.length === 0) {
        return [];
    }

    // 문장 경계로 분할 (마침표, 느낌표, 물음표, 줄바꿈 기준)
    const sentences = text
        .replace(/\n+/g, '\n')
        .split(/([.!?]\s+|\n)/)
        .filter(s => s.trim().length > 0);

    const chunks: string[] = [];
    let currentChunk = '';

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i]?.trim() || '';
        
        if (sentence.length === 0) continue;

        // 현재 청크에 문장을 추가했을 때 크기 확인
        const potentialChunk = currentChunk 
            ? `${currentChunk} ${sentence}` 
            : sentence;

        if (potentialChunk.length <= CHUNK_SIZE) {
            currentChunk = potentialChunk;
        } else {
            // 현재 청크가 완성됨
            if (currentChunk) {
                chunks.push(currentChunk);
            }

            // 이전 청크의 마지막 부분을 overlap으로 사용
            if (CHUNK_OVERLAP > 0 && currentChunk.length > CHUNK_OVERLAP) {
                const overlapText = currentChunk.slice(-CHUNK_OVERLAP);
                currentChunk = `${overlapText} ${sentence}`;
            } else {
                currentChunk = sentence;
            }
        }
    }

    // 마지막 청크 추가
    if (currentChunk.trim()) {
        chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [text];
}

interface JobData {
    fileKey: string;
    fileName: string;
    chatbotId: string;
    timestamp?: string;
    jobId?: string;
    attempt?: number;
    nextRunAt?: number; // epoch ms
}

async function processJob(jobData: JobData) {
    const { fileKey, fileName, chatbotId } = jobData;
    const attempt = jobData.attempt ?? 0;
    const jobId = jobData.jobId ?? `job_${Date.now()}`;
    console.log(`[WORKER] Job started (jobId=${jobId}, attempt=${attempt}) for: ${fileName}`);

    // 상태 업데이트: processing
    await redis.hset(`job:${jobId}`,
        'status', 'processing',
        'attempt', String(attempt),
        'fileName', fileName,
        'chatbotId', chatbotId,
        'updatedAt', new Date().toISOString(),
    );
    
    try {
        // 1. R2에서 파일 다운로드
        const fileBuffer = await downloadFileAsBuffer(fileKey);
        
        // 2. 문서 파싱 및 청크 분할
        // 파일 타입에 따른 파싱 로직 확장 가능 (PDF, DOCX 등)
        const textContent = fileBuffer.toString('utf-8');
        
        if (!textContent || textContent.trim().length === 0) {
            throw new Error(`파일이 비어있거나 텍스트로 변환할 수 없습니다: ${fileName}`);
        }

        const chunks = splitTextIntoChunks(textContent);
        console.log(`[WORKER] 파일을 ${chunks.length}개의 청크로 분할했습니다.`);
        
        // 3. 임베딩 생성 및 DB 저장
        let successCount = 0;
        for (let i = 0; i < chunks.length; i++) {
            const content = chunks[i];
            
            try {
                // 임베딩 생성
                const vector = await createEmbedding(content);
                
                if (!vector || vector.length === 0) {
                    console.warn(`[WORKER] 청크 ${i + 1}/${chunks.length}의 임베딩 생성 실패`);
                    continue;
                }

                // pgvector에 저장하기 위해 Raw SQL 사용
                // Prisma의 Unsupported("vector") 타입은 직접 INSERT가 어려우므로 Raw SQL 사용
                const vectorString = `[${vector.join(',')}]`;
                
                // cuid() 생성을 위해 Prisma Client의 내부 함수 사용
                // PostgreSQL에서는 cuid()를 직접 생성할 수 없으므로 JavaScript에서 생성
                // 간단한 방법으로 timestamp 기반 ID 생성 (실제로는 @paralleldrive/cuid2 등 사용 권장)
                const chunkId = `chunk_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`;
                
                await prisma.$executeRaw`
                    INSERT INTO "KBChunk" ("id", "chatbotId", "content", "sourceFileKey", "embedding", "metadata", "createdAt")
                    VALUES (${chunkId}, ${chatbotId}, ${content}, ${fileKey}, ${vectorString}::vector, ${JSON.stringify({ fileName, chunkIndex: i })}::jsonb, NOW())
                `;
                
                successCount++;
                
                // 진행 상황 로그
                if ((i + 1) % 10 === 0) {
                    console.log(`[WORKER] 진행 상황: ${i + 1}/${chunks.length} 청크 처리 완료`);
                }
            } catch (chunkError) {
                console.error(`[WORKER] 청크 ${i + 1} 처리 중 오류:`, chunkError);
                // 개별 청크 실패는 건너뛰고 계속 진행
            }
        }
        
        console.log(`[WORKER] Job completed for: ${fileName} (${successCount}/${chunks.length} 청크 저장 성공)`);
        // 상태 업데이트: completed 및 메트릭
        await redis.hset(`job:${jobId}`,
            'status', 'completed',
            'attempt', String(attempt),
            'successChunks', String(successCount),
            'totalChunks', String(chunks.length),
            'updatedAt', new Date().toISOString(),
        );
        await redis.incr(METRIC_PROCESSED);

    } catch (error) {
        console.error(`[WORKER ERROR] Failed to process ${fileName} (jobId=${jobId}, attempt=${attempt}):`, error);
        const lastError = error instanceof Error ? error.message : String(error);
        // 재시도 또는 DLQ 이동
        await handleJobFailure({ ...jobData, jobId, attempt }, lastError);
    }
}

function computeBackoffDelayMs(attempt: number): number {
    const delay = BASE_DELAY_MS * Math.pow(BACKOFF_FACTOR, Math.max(0, attempt - 1));
    // 상한 1분
    return Math.min(delay, 60_000);
}

async function handleJobFailure(jobData: JobData, lastError?: string) {
    const attempt = (jobData.attempt ?? 0) + 1;
    if (attempt >= MAX_ATTEMPTS) {
        // DLQ로 이동 (실패 사유를 함께 저장)
        const failedPayload = {
            ...jobData,
            attempt,
            failedAt: new Date().toISOString(),
            lastError,
        };
        await redis.lpush(DLQ_NAME, JSON.stringify(failedPayload));
        console.error(`[WORKER] Job moved to DLQ (jobId=${jobData.jobId}): ${jobData.fileName}`);
        await redis.hset(`job:${jobData.jobId}`,
            'status', 'failed',
            'attempt', String(attempt),
            'lastError', lastError || '',
            'failedAt', new Date().toISOString(),
            'updatedAt', new Date().toISOString(),
        );
        await redis.incr(METRIC_FAILED);
        return;
    }

    const delay = computeBackoffDelayMs(attempt);
    const nextRunAt = Date.now() + delay;
    const retryPayload = {
        ...jobData,
        attempt,
        nextRunAt,
    } as JobData;

    // 지연 큐: ZSET에 nextRunAt을 score로 저장
    await redis.zadd(DELAYED_SET, nextRunAt, JSON.stringify(retryPayload));
    console.warn(`[WORKER] Job scheduled for retry (jobId=${jobData.jobId}, attempt=${attempt}) in ${delay}ms`);
    await redis.hset(`job:${jobData.jobId}`,
        'status', 'retry_scheduled',
        'attempt', String(attempt),
        'nextRunAt', String(nextRunAt),
        'lastError', lastError || '',
        'updatedAt', new Date().toISOString(),
    );
    await redis.incr(METRIC_RETRIED);
}

// 큐 워커의 메인 루프
async function startWorker() {
    console.log(`[WORKER] Starting worker process...`);
    
    // Redis 연결 이벤트 핸들러
    redis.on('error', (error) => {
        console.error('[WORKER] Redis 오류:', error);
    });
    
    redis.on('close', () => {
        console.warn('[WORKER] Redis 연결이 종료되었습니다.');
    });
    
    redis.on('reconnecting', () => {
        console.log('[WORKER] Redis 재연결 중...');
    });
    
    redis.on('ready', () => {
        console.log('[WORKER] Redis 연결 준비 완료');
    });
    
    redis.on('connect', () => {
        console.log('[WORKER] Redis 연결됨');
    });
    
    // Redis 연결 확인
    try {
        // 연결이 이미 준비되어 있으면 대기
        if (redis.status === 'ready') {
            console.log(`[WORKER] Redis already connected`);
        } else if (redis.status === 'connecting') {
            console.log(`[WORKER] Redis connecting...`);
            await new Promise((resolve) => {
                redis.once('ready', resolve);
                redis.once('error', resolve);
            });
        } else {
            console.log(`[WORKER] Waiting for Redis connection...`);
            await new Promise((resolve) => {
                redis.once('ready', resolve);
                redis.once('error', resolve);
            });
        }
        
        // 연결 상태 확인
        if (redis.status !== 'ready') {
            throw new Error(`Redis connection failed. Status: ${redis.status}`);
        }
        
        console.log(`[WORKER] Redis connected. Status: ${redis.status}`);
    } catch (error) {
        console.error('[WORKER] Redis 연결 실패:', error);
        console.error('[WORKER] Redis 연결을 재시도합니다...');
        // 연결 실패 시 재시도
        await new Promise(resolve => setTimeout(resolve, 5000));
        return startWorker(); // 재귀적으로 재시도
    }
    
    console.log(`[WORKER] Listening to queue: ${QUEUE_NAME}`);
    
    // 무한 루프를 돌며 Redis 큐를 감시
    while (true) {
        try {
            // 1) 지연 큐에서 실행 시각이 지난 작업을 본 큐로 이동 (batch 10)
            const now = Date.now();
            const due = await redis.zrangebyscore(DELAYED_SET, 0, now, 'LIMIT', 0, 10);
            if (due && due.length > 0) {
                for (const item of due) {
                    const removed = await redis.zrem(DELAYED_SET, item);
                    if (removed) {
                        await redis.lpush(QUEUE_NAME, item);
                    }
                }
            }

            // Redis의 BRPOP명령: 
            // 큐에 데이터가 있을 때까지 10초 동안 대기, 데이터가 들어오면 꺼내옴
            const job = await redis.brpop(QUEUE_NAME, 10); 
            
            if (job) {
                const jobData: JobData = JSON.parse(job[1]);
                await processJob(jobData);
            }
        } catch (error) {
            console.error('[WORKER] 루프 실행 중 오류:', error);
            // 오류 발생 시 5초 대기 후 재시도 (ioredis가 자동으로 재연결 시도)
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// Worker를 시작
if (require.main === module) {
    startWorker().catch((error) => {
        console.error('[WORKER] Worker 시작 실패:', error);
        process.exit(1);
    });
} 