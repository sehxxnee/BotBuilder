// src/server/routers/rag.ts

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';
import { generateStreamingResponse, createEmbedding } from '@/server/services/groq';
import { getPresignedUploadUrl } from '@/server/services/r2'; // 🚨 R2 서비스 import 추가 🚨
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

// --- 1. 입력 유효성 검사 스키마 (Zod) ---
const CreateChatbotInput = z.object({
    name: z.string().min(3).max(50),
    systemPrompt: z.string().min(20).max(500).default("You are a helpful and concise AI assistant."),
});

const AnswerQuestionInput = z.object({
    chatbotId: z.string().cuid(),
    question: z.string().min(5),
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
            const newChatbot = await ctx.prisma.chatbot.create({
                data: {
                    name: input.name,
                    systemPrompt: input.systemPrompt,
                },
            });
            return newChatbot;
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
});