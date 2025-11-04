// src/app/api/stream/answer/route.ts
// 별도의 스트리밍 엔드포인트 - tRPC 변환 오류를 피하기 위해

import { createTRPCContext } from '@/server/trpc';
import { appRouter } from '@/server/routers';
import superjson from 'superjson';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // tRPC 입력 파싱
    let parsed;
    try {
      parsed = superjson.deserialize(body.json || body);
    } catch {
      // SuperJSON 파싱 실패 시 직접 사용
      parsed = body.json || body;
    }
    
    const { chatbotId, question } = parsed;

    if (!chatbotId || !question) {
      return Response.json(
        { error: 'chatbotId와 question이 필요합니다.' },
        { status: 400 }
      );
    }

    // 컨텍스트 생성
    const ctx = createTRPCContext({ headers: req.headers });

    // tRPC 프로시저 직접 호출 - appRouter의 createCaller 사용
    const caller = appRouter.createCaller(ctx);
    
    try {
      const result = await caller.rag.answerQuestion({
        chatbotId,
        question,
      });

      // ReadableStream인 경우 직접 Response 반환
      // Web API의 ReadableStream을 사용 (타입 체크는 구조적으로 확인)
      if (result && typeof result === 'object' && 'getReader' in result && typeof (result as any).getReader === 'function') {
        return new Response(result as BodyInit, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
        });
      }

      // 일반 응답인 경우 (이 경우는 발생하지 않아야 함)
      console.warn('예상치 못한 응답 타입:', typeof result);
      return Response.json({ error: '스트리밍 응답을 받을 수 없습니다.' }, { status: 500 });
    } catch (trpcError: any) {
      // tRPC 에러를 더 자세히 로깅
      console.error('tRPC 호출 오류:', trpcError);
      console.error('tRPC 오류 코드:', trpcError?.code);
      console.error('tRPC 오류 메시지:', trpcError?.message);
      console.error('tRPC 오류 스택:', trpcError?.stack);
      
      // tRPC 에러를 그대로 전달
      throw trpcError;
    }
  } catch (error) {
    console.error('스트리밍 API 오류:', error);
    
    // 더 자세한 오류 정보 반환
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return Response.json(
      { 
        error: `스트리밍 처리 중 오류가 발생했습니다: ${errorMessage}`,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

