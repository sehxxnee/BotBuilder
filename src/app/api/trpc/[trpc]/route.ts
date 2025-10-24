// src/app/api/trpc/[trpc]/route.ts

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers';
import { createTRPCContext } from '@/server/trpc';

import { ReadableStream } from 'stream/web';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,

    responseMeta: ({ data, errors, type }) => {
        // 'mutation' 타입의 요청에서 데이터가 ReadableStream 인스턴스인 경우를 감지
        if (type === 'mutation' && data instanceof ReadableStream) {
            // ReadableStream이 감지되면, Next.js의 Response 객체로 스트림을 반환합니다.
            // HTTP 상태 코드 200과 Content-Type을 'text/plain'으로 설정하여 스트리밍을 처리합니다.
            return {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Transfer-Encoding': 'chunked', // 스트리밍 응답임을 명시
                },
                body: data, // 스트림 자체를 응답 본문으로 전달
            };
        }
        
        // 스트리밍이 아닌 일반적인 tRPC 요청(JSON 응답)은 기본 처리
        return {}; 
    },
    
    // 스트리밍 응답 본문을 직접 처리하므로, 기본 응답 로직을 비활성화
    // (responseMeta에서 body를 반환하면 tRPC의 기본 로직을 오버라이드합니다.)

  });

export { handler as GET, handler as POST };

 