import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';
import { generateStreamingResponse, createEmbedding } from '@/server/services/groq';
import { getPresignedUploadUrl } from '@/server/services/r2';
import { TRPCError } from '@trpc/server';
import { PrismaClientKnownRequestError, PrismaClientInitializationError } from '@prisma/client/runtime/library';

// --- 1. 입력 유효성 검사 스키마 (Zod) ---
const CreateChatbotInput = z.object({
    name: z.string().min(3).max(50),
    systemPrompt: z.string().min(20).max(500).default("You are a helpful and concise AI assistant."),
});

const AnswerQuestionInput = z.object({
    chatbotId: z.string().cuid(),
    question: z.string().min(5),
});

// 🚨 새 Input Schema: 파일 처리 요청 🚨
const ProcessFileInput = z.object({
    chatbotId: z.string().cuid(),
    fileKey: z.string().min(1), // R2에 저장된 파일의 고유 키 (getUploadUrl에서 받음)
    fileName: z.string().min(1),
});

// 🚨 새 Input Schema: 파일 업로드 요청 🚨
const GetUploadUrlInput = z.object({
    fileName: z.string().min(1, "파일 이름은 비어 있을 수 없습니다."),
    // 문서 MIME 타입만 허용 (보안 및 RAG 처리 가능 파일 제한)
    fileType: z.string().refine(
        (val) => val.startsWith('application/') || val.startsWith('text/'),
        { message: "유효한 문서 MIME 타입(application/pdf, text/plain 등)이 필요합니다." }
    ),
});


// --- 2. RAG 라우터 정의 ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
export const ragRouter = createTRPCRouter({

    // A. 챗봇 생성 (Mutation) - 기존 코드 유지
    createChatbot: publicProcedure
        .input(CreateChatbotInput)
        .mutation(async ({ ctx, input }) => {
            try {
                console.log('[createChatbot] 챗봇 생성 시작:', input.name);
                
                // 현재 DATABASE_URL 확인 (비밀번호 제외)
                const dbUrl = process.env.DATABASE_URL;
                if (dbUrl) {
                    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
                    console.log('[createChatbot] 현재 DATABASE_URL:', maskedUrl);
                    
                    // 사용자명 형식 확인
                    const userMatch = dbUrl.match(/postgresql:\/\/([^:]+):/);
                    if (userMatch) {
                        const username = userMatch[1];
                        console.log('[createChatbot] 현재 사용자명:', username);
                        if (!username.includes('postgres.lbrpzmzoqprypacgmwnn')) {
                            console.error('❌ 사용자명 형식 오류! 올바른 형식: postgres.lbrpzmzoqprypacgmwnn');
                            console.error('   현재:', username);
                        }
                    }
                }
                
                // 쿼리 실행 직전 DATABASE_URL 최종 확인
                const finalDbUrl = process.env.DATABASE_URL || '';
                if (finalDbUrl) {
                    const maskedUrl = finalDbUrl.replace(/:[^:@]+@/, ':****@');
                    console.log('[createChatbot] 쿼리 실행 직전 DATABASE_URL:', maskedUrl);
                    
                    const userMatch = finalDbUrl.match(/postgresql:\/\/([^:]+):/);
                    const finalUsername = userMatch ? userMatch[1] : '';
                    console.log('[createChatbot] 쿼리 실행 직전 사용자명:', finalUsername);
                    
                    if (finalUsername !== 'postgres.lbrpzmzoqprypacgmwnn') {
                        console.error('❌❌❌ 쿼리 실행 직전 사용자명이 여전히 잘못되었습니다!');
                        console.error('   현재:', finalUsername);
                        console.error('   올바른 형식: postgres.lbrpzmzoqprypacgmwnn');
                        console.error('   전체 URL:', maskedUrl);
                        console.error('   ⚠️ DATABASE_URL 자동 변환이 작동하지 않았습니다.');
                        console.error('   💡 .env 파일의 DATABASE_URL을 직접 확인하세요.');
                    }
                }
                
                // Prisma 연결 테스트 (간단한 쿼리로 연결 확인)
                try {
                    console.log('[createChatbot] Prisma 연결 테스트 시작...');
                    await ctx.prisma.$queryRaw`SELECT 1 as test`;
                    console.log('[createChatbot] ✅ Prisma 연결 성공');
                } catch (testError) {
                    console.error('[createChatbot] ❌ Prisma 연결 테스트 실패:', testError);
                    const errorDetails: {
                        message: string;
                        code?: string;
                        meta?: unknown;
                    } = {
                        message: testError instanceof Error ? testError.message : String(testError),
                    };
                    if (testError instanceof PrismaClientKnownRequestError) {
                        errorDetails.code = testError.code;
                        errorDetails.meta = testError.meta;
                    } else if (testError instanceof PrismaClientInitializationError) {
                        errorDetails.code = testError.errorCode;
                    } else if (testError && typeof testError === 'object' && 'code' in testError) {
                        errorDetails.code = String(testError.code);
                    }
                    if (testError && typeof testError === 'object' && 'meta' in testError && !(testError instanceof PrismaClientInitializationError)) {
                        errorDetails.meta = testError.meta;
                    }
                    console.error('[createChatbot] 연결 테스트 오류 상세:', errorDetails);
                    // 연결 테스트 실패 시에도 실제 쿼리 시도 (혹시 모를 경우 대비)
                }
                
                console.log('[createChatbot] 챗봇 생성 쿼리 실행 시작...');
                const newChatbot = await ctx.prisma.chatbot.create({
                    data: {
                        name: input.name,
                        systemPrompt: input.systemPrompt,
                    },
                });
                
                console.log('[createChatbot] 챗봇 생성 완료:', newChatbot.id);
                
                // SuperJSON이 Date 객체를 자동으로 직렬화하므로 그대로 반환
                // Prisma의 DateTime은 JavaScript Date 객체로 변환되므로 SuperJSON이 처리 가능
                return newChatbot;
            } catch (error) {
                // 실제 Prisma 오류를 상세하게 로깅
                const errorDetails: {
                    error: unknown;
                    message: string;
                    code?: string;
                    meta?: unknown;
                    stack?: string;
                } = {
                    error,
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                };
                if (error instanceof PrismaClientKnownRequestError) {
                    errorDetails.code = error.code;
                    errorDetails.meta = error.meta;
                } else if (error instanceof PrismaClientInitializationError) {
                    errorDetails.code = error.errorCode;
                } else if (error && typeof error === 'object' && 'code' in error) {
                    errorDetails.code = String(error.code);
                }
                if (error && typeof error === 'object' && 'meta' in error && !(error instanceof PrismaClientInitializationError)) {
                    errorDetails.meta = error.meta;
                }
                console.error('[createChatbot] Prisma 오류 상세:', errorDetails);
                
                // DATABASE_URL도 로깅
                const dbUrl = process.env.DATABASE_URL;
                if (dbUrl) {
                    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
                    console.error('[createChatbot] 오류 발생 시 DATABASE_URL:', maskedUrl);
                    
                    // 사용자명 형식 확인
                    const userMatch = dbUrl.match(/postgresql:\/\/([^:]+):/);
                    if (userMatch) {
                        console.error('[createChatbot] 현재 사용자명:', userMatch[1]);
                        console.error('[createChatbot] 올바른 형식: postgres.lbrpzmzoqprypacgmwnn');
                    }
                }
                
                // 원본 오류를 그대로 throw (메시지 덮어쓰기 제거)
                throw error;
            }
        }),

    // B. RAG 기반 답변 스트리밍 (Mutation) - 기존 코드 유지
    answerQuestion: publicProcedure
        .input(AnswerQuestionInput)
        .mutation(async ({ ctx, input }) => {
            const { question, chatbotId } = input;
            const { prisma } = ctx;

            // 1. 챗봇 정보 로드
            const chatbot = await prisma.chatbot.findUnique({
                where: { id: chatbotId },
            });
            if (!chatbot) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Chatbot not found.' });
            }

            // 2. 🤖 질문 임베딩 생성
            const questionVector = await createEmbedding(question);

            if (!questionVector || questionVector.length === 0) {
                const defaultContext = "지식 기반을 로드할 수 없습니다. 관련 파일이 업로드되었는지 확인해주세요.";
                return generateStreamingResponse(
                    chatbot.systemPrompt,
                    question,
                    defaultContext
                );
            }

            // 3. 🔍 pgvector 유사도 검색 (Raw SQL)
            const vectorString = `[${questionVector.join(',')}]`;

            type ChunkResult = {
                content: string;
                similarity: number;
            };

            const relevantChunks: ChunkResult[] = await prisma.$queryRaw<ChunkResult[]>`
                SELECT 
                    content, 
                    "embedding" <-> ${vectorString}::vector AS similarity
                FROM "KBChunk"
                WHERE "chatbotId" = ${chatbotId}
                ORDER BY similarity ASC 
                LIMIT 5;
            `;

            // 4. 컨텍스트 구성
            const contextText = relevantChunks
                .map(chunk => chunk.content)
                .join('\n\n--- 컨텍스트 청크 구분선 ---\n\n');

            // 5. Groq 스트리밍 응답 생성
            const stream = await generateStreamingResponse(
                chatbot.systemPrompt,
                question,
                contextText
            );

            return stream;
        }),

    // 🚨 C. 파일 업로드를 위한 Presigned URL 발급 (새로운 기능) 🚨
    getUploadUrl: publicProcedure
        .input(GetUploadUrlInput)
        .mutation(async ({ input }) => {
            // R2 서비스 함수를 호출하여 Presigned URL과 고유 Key를 받아옵니다.
            const { url, fileKey } = await getPresignedUploadUrl(
                input.fileName,
                input.fileType
            );
            
            // 클라이언트는 이 URL을 사용하여 R2에 직접 PUT 요청을 보내게 됩니다.
            return {
                uploadUrl: url,
                fileKey: fileKey, // DB에 이 키를 저장하여 나중에 파일을 찾을 때 사용
            };
        }),

        // D. 파일 처리 요청을 받아 큐에 작업을 추가 (비동기 워크플로우 시작) 🚨 새로운 기능 🚨
    processFile: publicProcedure
        .input(ProcessFileInput)
        .mutation(async ({ ctx, input }) => {
            const { fileKey, fileName, chatbotId } = input;
            const { redis, prisma } = ctx; 
            const QUEUE_NAME = 'embedding_queue';

            // 1. 챗봇 존재 여부 확인 (보안 및 유효성 검사)
            const chatbot = await prisma.chatbot.findUnique({
                where: { id: chatbotId },
                select: { id: true, name: true },
            });
            if (!chatbot) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Chatbot not found.' });
            }

            // 2. 🚨 Redis 큐에 비동기 작업(Job)을 추가
            const jobData = { 
                fileKey, 
                fileName, 
                chatbotId,
                // 작업의 신뢰성을 높이기 위해 타임스탬프 추가
                timestamp: new Date().toISOString(), 
            };
            
            // Redis List에 Job 데이터를 JSON 문자열로 직렬화하여 푸시
            // lpush는 큐에 데이터를 추가하는 역할을 합니다.
            await redis.lpush(QUEUE_NAME, JSON.stringify(jobData)); 
            
            // 3. 응답: 클라이언트에게 작업이 성공적으로 시작되었음을 알림
            return {
                success: true,
                message: `'${fileName}' 파일의 학습 작업이 큐에 추가되었습니다. 잠시 후 챗봇 ${chatbot.name}에 반영됩니다.`,
            };
        }),
});