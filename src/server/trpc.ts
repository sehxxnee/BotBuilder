import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

/**
 * tRPC 컨텍스트 초기화. 
 * 요청(req), 응답(res), 데이터베이스 클라이언트 등 모든 라우터에서 공유할 정보를 정의합니다.
 */
export const createTRPCContext = (opts: { headers: Headers }) => {
  // 실제 DB 연결 (Prisma Client)은 여기서 인스턴스화하거나 별도 파일에서 불러옵니다.
  // 이 예시에서는 빈 객체를 반환하지만, 실제로는 Prisma 인스턴스를 추가해야 합니다.
  return {
    headers: opts.headers,
    // prisma: prisma,  <-- 여기에 Prisma Client를 추가할 예정입니다.
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  // JSON 직렬화/역직렬화에 SuperJSON을 사용하여 Date, Map 등 복잡한 타입도 처리
  transformer: superjson, 
  
  // 에러 처리 및 형식 지정 (Zod 유효성 검사 실패 시 에러 타입 지정)
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

/**
 * 기본 tRPC 함수들
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;  
 