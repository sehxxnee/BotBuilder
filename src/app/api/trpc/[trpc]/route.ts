// src/app/api/trpc/[trpc]/route.ts

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers';
import { createTRPCContext } from '@/server/trpc';

const handler = async (req: Request) => {
  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: async (opts) => {
        try {
          return createTRPCContext({ headers: opts.req.headers });
        } catch (error) {
          console.error('[createContext] 컨텍스트 생성 오류:', error);
          console.error('[createContext] 오류 스택:', error instanceof Error ? error.stack : '스택 없음');
          // 컨텍스트 생성 실패 시에도 기본 컨텍스트 반환 시도
          return createTRPCContext({ headers: opts.req.headers });
        }
      },
      // tRPC v11에서는 transformer를 명시적으로 설정하지 않아도 서버의 transformer를 사용
      // 하지만 명시적으로 설정하면 더 안전함
      onError({ error, path, type, input }) {
        console.error(`[tRPC 오류] [${path}][${type}]:`, error);
        console.error('[tRPC 오류] 스택:', error instanceof Error ? error.stack : '스택 없음');
        console.error('[tRPC 오류] 입력값:', input);
        if (error.cause) {
          console.error('[tRPC 오류] 원인:', error.cause);
        }
      },
    });
    
    // Response가 HTML인 경우 (에러 페이지) JSON으로 변환
    if (response instanceof Response) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/html')) {
        // Response를 복제하여 text를 읽어도 원본을 사용할 수 있도록 함
        const clonedResponse = response.clone();
        const text = await clonedResponse.text();
        console.error('[tRPC 핸들러] HTML 응답 감지 (에러 페이지):', text.substring(0, 500));
        return new Response(
          JSON.stringify({
            error: 'Internal Server Error',
            message: '서버에서 에러가 발생했습니다. 서버 로그를 확인해주세요.',
            details: process.env.NODE_ENV === 'development' ? text.substring(0, 1000) : undefined,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    return response;
  } catch (error) {
    console.error('[tRPC 핸들러] 최상위 오류:', error);
    console.error('[tRPC 핸들러] 오류 스택:', error instanceof Error ? error.stack : '스택 없음');
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export { handler as GET, handler as POST };

 