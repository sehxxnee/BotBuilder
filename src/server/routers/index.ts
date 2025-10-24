// src/server/routers/index.ts

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { ragRouter } from './rag';
/**
 * 모든 tRPC 라우터를 포함하는 메인 라우터입니다.
 */
export const appRouter = createTRPCRouter({
  // 예시 API 라우터
  greeting: publicProcedure
    .input(z.object({ text: z.string() })) // 입력값 유효성 검사 (Zod)
    .query(({ input }) => { // 쿼리 (데이터 조회)
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
    rag: ragRouter,
  // 여기에 chatbot, rag, builder 등의 서브 라우터가 추가될 예정입니다.
});

// tRPC 타입 유추를 위한 설정
export type AppRouter = typeof appRouter;