// src/server/routers/rag.ts

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';
import { generateStreamingResponse, createEmbedding } from '@/server/services/groq'; // LLM 서비스
import { TRPCError } from '@trpc/server';

// 🚨 주의: RAG 라우터는 tRPC 컨텍스트에 추가된 prisma 인스턴스 (ctx.prisma)를 사용합니다.

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
  
  // A. 챗봇 생성 (Mutation)
  createChatbot: publicProcedure
    .input(CreateChatbotInput)
    .mutation(async ({ ctx, input }) => {
      // Prisma를 사용하여 DB에 챗봇 정보 저장
      const newChatbot = await ctx.prisma.chatbot.create({
        data: {
          name: input.name,
          systemPrompt: input.systemPrompt,
        },
      });
      return newChatbot;
    }),

  // B. RAG 기반 답변 스트리밍 (Query + Streaming Logic)
  answerQuestion: publicProcedure
    .input(AnswerQuestionInput)
    .mutation(async ({ ctx, input }) => {
      // 1. 챗봇 정보 로드
      const chatbot = await ctx.prisma.chatbot.findUnique({
        where: { id: input.chatbotId },
      });
      if (!chatbot) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Chatbot not found.' });
      }

      // 2. RAG 검색 (Placeholder)
      const questionEmbedding = await createEmbedding(input.question);
      //  실제로는 pgvector를 사용해 DB에서 유사한 KBChunk를 검색하는 로직이 필요합니다.
      const retrievedChunks = [
        { content: "프리미엄 요금제는 월 19,900원이며 24시간 지원을 포함합니다." },
        { content: "환불 정책은 구매 후 7일 이내에 유효합니다." },
      ];
      
      const contextString = retrievedChunks.map(c => c.content).join('\n---\n');

      // 3. Groq 스트리밍 응답 생성
      const stream = await generateStreamingResponse(
        chatbot.systemPrompt,
        input.question,
        contextString
      );

      //  Next.js 라우터로 ReadableStream을 반환
      return stream;
    }),
});