import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';
import { getPresignedUploadUrl, uploadFileToR2 } from '@/server/infrastructure/r2/client';
import { TRPCError } from '@trpc/server';
import { RagRepository } from '@/server/domain/rag/repository';
import { createChatbotUsecase } from '@/server/domain/rag/usecases/createChatbot';
import { answerQuestionUsecase } from '@/server/domain/rag/usecases/answerQuestion';
import { processFileUsecase } from '@/server/domain/rag/usecases/processFile';
import { getChatbotsUsecase } from '@/server/domain/rag/usecases/getChatbots';
import { getChatbotDetailsUsecase } from '@/server/domain/rag/usecases/getChatbotDetails';
import { getChatHistoryUsecase } from '@/server/domain/rag/usecases/getChatHistory';

// --- 1. 입력 유효성 검사 스키마 (Zod) ---
const CreateChatbotInput = z.object({
    name: z.string().min(3).max(50),
    systemPrompt: z.string().min(20).max(500).default("You are a helpful and concise AI assistant."),
});

const AnswerQuestionInput = z.object({
    chatbotId: z.string().cuid(),
    question: z.string().min(5),
});

const GetChatbotDetailsInput = z.object({
    chatbotId: z.string().cuid(),
});

const GetChatHistoryInput = z.object({
    chatbotId: z.string().cuid(),
    limit: z.number().min(1).max(100).optional().default(50),
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

    // A. 챗봇 생성 (Mutation)
    createChatbot: publicProcedure
        .input(CreateChatbotInput)
        .mutation(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            return createChatbotUsecase(repo, { name: input.name, systemPrompt: input.systemPrompt });
        }),

    // B. RAG 기반 답변 스트리밍 (Mutation)
    answerQuestion: publicProcedure
        .input(AnswerQuestionInput)
        .mutation(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            try {
                const result = await answerQuestionUsecase(repo, { chatbotId: input.chatbotId, question: input.question });
                // 스트리밍만 반환 (retrievedChunkIds는 getAnswerMetadata로 조회 가능)
                return result.stream;
            } catch (e) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Chatbot not found.' });
            }
        }),

    // B-1. 답변에 사용된 검색 결과 조회 (Metadata) - answerQuestion과 동일한 로직
    getAnswerMetadata: publicProcedure
        .input(AnswerQuestionInput)
        .query(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            try {
                const chatbot = await repo.findChatbotById(input.chatbotId);
                if (!chatbot) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Chatbot not found.' });
                }

                const { createEmbedding } = await import('@/server/infrastructure/llm/groq');
                const questionVector = await createEmbedding(input.question);
                
                if (!questionVector || questionVector.length === 0) {
                    return { retrievedChunkIds: [] };
                }

                const chunks = await repo.queryRelevantChunks(input.chatbotId, questionVector, 5);
                return { retrievedChunkIds: chunks.map((c) => c.id) };
            } catch (e) {
                if (e instanceof TRPCError) throw e;
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get answer metadata.' });
            }
        }),

    // B-2. 답변 완료 후 QueryLog 저장 (Mutation)
    saveAnswer: publicProcedure
        .input(z.object({
            chatbotId: z.string().cuid(),
            question: z.string().min(5),
            answer: z.string().min(1),
            retrievedChunkIds: z.array(z.string()).default([]),
        }))
        .mutation(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            try {
                return await repo.createQueryLog({
                    chatbotId: input.chatbotId,
                    question: input.question,
                    answer: input.answer,
                    retrievedChunkIds: input.retrievedChunkIds,
                });
            } catch (e) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save query log.' });
            }
        }),

    // C. 챗봇 목록 조회 (Query)
    getChatbots: publicProcedure
        .query(async ({ ctx }) => {
            const repo = new RagRepository(ctx.prisma);
            return getChatbotsUsecase(repo);
        }),

    // D. 챗봇 상세 조회 (Query)
    getChatbotDetails: publicProcedure
        .input(GetChatbotDetailsInput)
        .query(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            return getChatbotDetailsUsecase(repo, input.chatbotId);
        }),

    // E. 대화 기록 조회 (Query)
    getChatHistory: publicProcedure
        .input(GetChatHistoryInput)
        .query(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            return getChatHistoryUsecase(repo, input.chatbotId, input.limit);
        }),

    // C-1. 파일 업로드를 위한 Presigned URL 발급 (CORS 설정 시 사용)
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

    // 🚨 C-2. 백엔드를 통한 파일 업로드 (CORS 문제 회피)
    uploadFile: publicProcedure
        .input(z.object({
            fileName: z.string().min(1),
            fileType: z.string().refine(
                (val) => val.startsWith('application/') || val.startsWith('text/'),
                { message: "유효한 문서 MIME 타입(application/pdf, text/plain 등)이 필요합니다." }
            ),
            fileData: z.string(), // Base64 인코딩된 파일 데이터
        }))
        .mutation(async ({ input }) => {
            try {
                // Base64 데이터를 Buffer로 변환
                const fileBuffer = Buffer.from(input.fileData, 'base64');
                
                // 파일 키 생성
                const fileKey = `rag-files/${Date.now()}-${input.fileName}`;
                
                // R2에 직접 업로드
                await uploadFileToR2(fileKey, fileBuffer, input.fileType);
                
                return {
                    fileKey,
                    success: true,
                };
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `파일 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                });
            }
        }),

        // D. 파일 처리 요청을 받아 큐에 작업을 추가 (비동기 워크플로우 시작)
    processFile: publicProcedure
        .input(ProcessFileInput)
        .mutation(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            try {
                return await processFileUsecase({ repo, redis: ctx.redis }, {
                    chatbotId: input.chatbotId,
                    fileKey: input.fileKey,
                    fileName: input.fileName,
                });
            } catch (e) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Chatbot not found.' });
            }
        }),
});