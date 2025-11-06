import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { RagRepository } from '@/server/domain/rag/repository';
import { createChatbotUsecase } from '@/server/domain/rag/usecases/createChatbot';
import { answerQuestionUsecase } from '@/server/domain/rag/usecases/answerQuestion';
import { processFileUsecase } from '@/server/domain/rag/usecases/processFile';
import { getChatbotsUsecase } from '@/server/domain/rag/usecases/getChatbots';
import { getChatbotDetailsUsecase } from '@/server/domain/rag/usecases/getChatbotDetails';
import { getChatHistoryUsecase } from '@/server/domain/rag/usecases/getChatHistory';
import { getAnswerMetadataUsecase } from '@/server/domain/rag/usecases/getAnswerMetadata';
import { saveAnswerUsecase } from '@/server/domain/rag/usecases/saveAnswer';
import { uploadFileUsecase } from '@/server/domain/rag/usecases/uploadFile';
import { getUploadUrlUsecase } from '@/server/domain/rag/usecases/getUploadUrl';
import { getJobStatus } from '@/server/infrastructure/redis/jobStatus';
import type { Redis } from 'ioredis';

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

    // A. 챗봇 생성 (Mutation) - 인증 필요
    createChatbot: protectedProcedure
        .input(CreateChatbotInput)
        .mutation(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            return createChatbotUsecase(repo, { 
                name: input.name, 
                systemPrompt: input.systemPrompt,
                userId: ctx.auth.userId,
            });
        }),

    // B. RAG 기반 답변 스트리밍 (Mutation)
    answerQuestion: publicProcedure
        .input(AnswerQuestionInput)
        .mutation(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            // 존재 여부를 먼저 명확히 확인 (명시적 404)
            const exists = await repo.findChatbotById(input.chatbotId);
            if (!exists) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Chatbot not found.' });
            }

            try {
                const result = await answerQuestionUsecase(repo, { chatbotId: input.chatbotId, question: input.question });
                // 스트리밍만 반환 (retrievedChunkIds는 getAnswerMetadata로 조회 가능)
                return result.stream;
            } catch (e: any) {
                if (e instanceof TRPCError) throw e;
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e?.message || 'Failed to answer question.' });
            }
        }),

    // B-1. 답변에 사용된 검색 결과 조회 (Metadata) - answerQuestion과 동일한 로직
    getAnswerMetadata: publicProcedure
        .input(AnswerQuestionInput)
        .query(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            return getAnswerMetadataUsecase(repo, {
                chatbotId: input.chatbotId,
                question: input.question,
            });
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
            return saveAnswerUsecase(repo, {
                chatbotId: input.chatbotId,
                question: input.question,
                answer: input.answer,
                retrievedChunkIds: input.retrievedChunkIds,
            });
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

    // F. 작업 상태 조회 (Query)
    getProcessStatus: publicProcedure
        .input(z.object({ jobId: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
            const redis = ctx.redis as Redis;
            return getJobStatus(redis, input.jobId);
        }),

    // C-1. 파일 업로드를 위한 Presigned URL 발급 (CORS 설정 시 사용)
    getUploadUrl: publicProcedure
        .input(GetUploadUrlInput)
        .mutation(async ({ input }) => {
            return getUploadUrlUsecase({
                fileName: input.fileName,
                fileType: input.fileType,
            });
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
            return uploadFileUsecase({
                fileName: input.fileName,
                fileType: input.fileType,
                fileData: input.fileData,
            });
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