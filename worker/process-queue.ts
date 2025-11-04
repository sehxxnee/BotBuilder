//Next.js 서버와 별도로 동작하는 비동기 워커 프로세스  -> 무한 루프 로직
import { prisma } from '../src/server/db';
import { downloadFileAsBuffer } from '../src/server/infrastructure/r2/client';
import { createEmbedding } from '../src/server/infrastructure/llm/groq';
import { createRedisClient } from '../src/server/infrastructure/redis/client';

// Worker 전용 Redis 클라이언트 생성 (서버와 독립적으로 동작)
// 자동 연결을 위해 lazyConnect 옵션 없음
const redis = createRedisClient();  

const QUEUE_NAME = 'embedding_queue';

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
}

async function processJob(jobData: JobData) {
    const { fileKey, fileName, chatbotId } = jobData;
    console.log(`[WORKER] Job started for: ${fileName}`);
    
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

    } catch (error) {
        console.error(`[WORKER ERROR] Failed to process ${fileName}:`, error);
        // 실패 시 데드 레터 큐(DLQ) 또는 알림 로직 추가
    }
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
            // Redis의 BRPOP명령: 
            // 큐에 데이터가 있을 때까지 10초 동안 대기, 데이터가 들어오면 꺼내옴
            const job = await redis.brpop(QUEUE_NAME, 10); 
            
            if (job) {
                const jobData = JSON.parse(job[1]);
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