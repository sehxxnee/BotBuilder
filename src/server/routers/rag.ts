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

const ProcessFileInput = z.object({
    chatbotId: z.string().cuid(),
    fileKey: z.string().min(1),
    fileName: z.string().min(1),
});

const GetUploadUrlInput = z.object({
    fileName: z.string().min(1, "파일 이름은 비어 있을 수 없습니다."),
    fileType: z.string().refine(
        (val) => val.startsWith('application/') || val.startsWith('text/'),
        { message: "유효한 문서 MIME 타입(application/pdf, text/plain 등)이 필요합니다." }
    ),
});

export const ragRouter = createTRPCRouter({
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

    answerQuestion: publicProcedure
        .input(AnswerQuestionInput)
        .mutation(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            const exists = await repo.findChatbotById(input.chatbotId);
            if (!exists) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Chatbot not found.' });
            }

            try {
                const result = await answerQuestionUsecase(repo, { chatbotId: input.chatbotId, question: input.question });
                return result.stream;
            } catch (e: any) {
                if (e instanceof TRPCError) throw e;
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e?.message || 'Failed to answer question.' });
            }
        }),

    getAnswerMetadata: publicProcedure
        .input(AnswerQuestionInput)
        .query(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            return getAnswerMetadataUsecase(repo, {
                chatbotId: input.chatbotId,
                question: input.question,
            });
        }),

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

    getChatbots: publicProcedure
        .query(async ({ ctx }) => {
            const repo = new RagRepository(ctx.prisma);
            return getChatbotsUsecase(repo);
        }),

    getChatbotDetails: publicProcedure
        .input(GetChatbotDetailsInput)
        .query(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            return getChatbotDetailsUsecase(repo, input.chatbotId);
        }),

    getChatHistory: publicProcedure
        .input(GetChatHistoryInput)
        .query(async ({ ctx, input }) => {
            const repo = new RagRepository(ctx.prisma);
            return getChatHistoryUsecase(repo, input.chatbotId, input.limit);
        }),

    getProcessStatus: publicProcedure
        .input(z.object({ jobId: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
            const redis = ctx.redis as Redis;
            return getJobStatus(redis, input.jobId);
        }),

    getUploadUrl: publicProcedure
        .input(GetUploadUrlInput)
        .mutation(async ({ input }) => {
            return getUploadUrlUsecase({
                fileName: input.fileName,
                fileType: input.fileType,
            });
        }),

    uploadFile: publicProcedure
        .input(z.object({
            fileName: z.string().min(1),
            fileType: z.string().refine(
                (val) => val.startsWith('application/') || val.startsWith('text/'),
                { message: "유효한 문서 MIME 타입(application/pdf, text/plain 등)이 필요합니다." }
            ),
            fileData: z.string(),
        }))
        .mutation(async ({ input }) => {
            return uploadFileUsecase({
                fileName: input.fileName,
                fileType: input.fileType,
                fileData: input.fileData,
            });
        }),

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