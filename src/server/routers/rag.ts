import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/trpc'; 
import { generateStreamingResponse, createEmbedding } from '@/server/services/groq'; 
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

// --- 2. RAG 라우터 정의 ---
export const ragRouter = createTRPCRouter({

    // A. 챗봇 생성 (Mutation) - 코드 변경 없음
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

    // B. RAG 기반 답변 스트리밍 (Mutation) - 🚨 검색 로직 업데이트 🚨
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

            // 2. 🤖 질문 임베딩 생성 (실제 임베딩 벡터를 얻어옵니다.)
            // ----------------------------------------------------
            const questionVector = await createEmbedding(question);

            if (!questionVector || questionVector.length === 0) {
                // 임베딩이 실패했거나 데이터베이스에 청크가 없는 경우를 고려
                const defaultContext = "지식 기반을 로드할 수 없습니다. 관련 파일이 업로드되었는지 확인해주세요.";
                return generateStreamingResponse(
                    chatbot.systemPrompt,
                    question,
                    defaultContext // 기본 컨텍스트로 LLM 호출
                );
            }

            // 3. 🔍 pgvector 유사도 검색 (Raw SQL)
            // ----------------------------------------------------
            // Array를 string 형태로 변환하여 SQL에 안전하게 삽입
            const vectorString = `[${questionVector.join(',')}]`;
            
            // Raw 쿼리 타입 정의
            type ChunkResult = {
                content: string;
                similarity: number;
            };

            const relevantChunks: ChunkResult[] = await prisma.$queryRaw<ChunkResult[]>`
                SELECT 
                    content, 
                    -- pgvector의 L2 거리 연산자 (<->) 사용
                    "embedding" <-> ${vectorString}::vector AS similarity
                FROM "KBChunk"
                WHERE "chatbotId" = ${chatbotId}
                ORDER BY similarity ASC -- 거리가 짧을수록 유사도가 높으므로 오름차순
                LIMIT 5;
            `;

            // 4. 컨텍스트 구성
            // ----------------------------------------------------
            const contextText = relevantChunks
                .map(chunk => chunk.content)
                .join('\n\n--- 컨텍스트 청크 구분선 ---\n\n');

            // 5. Groq 스트리밍 응답 생성
            // ----------------------------------------------------
            const stream = await generateStreamingResponse(
                chatbot.systemPrompt,
                question,
                contextText
            );

            // Next.js 라우터로 ReadableStream을 반환
            return stream;
        }),
});