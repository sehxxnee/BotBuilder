// prisma, redis, r2Client 등 모든 백엔드 자원 통합하여 모든 API 함수가 접근할 수 있도록 정의하는 파일

import { initTRPC, TRPCError } from '@trpc/server'; // TRPCError import 추가
import superjson from 'superjson';
import { ZodError } from 'zod';
import { getPrismaClient } from '@/server/db'; 
import { redis, checkRateLimit } from '@/server/services/redis'; // checkRateLimit import 추가
import { r2Client } from '@/server/services/r2'; 

//tRPC 컨텍스트 초기화 ->  ctx 만들어내는 공장
export const createTRPCContext = (opts: { headers: Headers }) => {
	// 여기서 모든 백엔드 자원들을 반환하여, 모든 tRPC 프로시저(API 함수)에서 
	// ctx.prisma, ctx.redis, ctx.r2Client 로 접근할 수 있게 함.
	// 개발 환경에서는 항상 최신 DATABASE_URL을 사용하는 Prisma Client 반환
	return {
		headers: opts.headers,
		prisma: getPrismaClient(), 
		redis, 
		r2Client, 
	};
};

// 컨텍스트 타입 추론을 위한 타입 정의 (이것이 tRPC의 타입 안전성을 보장합니다.)
type Context = Awaited<ReturnType<typeof createTRPCContext>>;

//tRPC 서버 인스턴스: 서버가 지켜야 할 모든 규칙과 설정 통합하는 부분
// -> 필요한 이유 : 중앙 집중식 규칙 : 앞으로 정의할 API는 T에 정의된 규칙 자동 상속
const t = initTRPC.context<Context>().create({
	// JSON 직렬화/역직렬화에 SuperJSON을 사용하여 Date, Map 등 복잡한 타입도 처리
	transformer: superjson, 
	//웹에서 데이터를 주고받는 기본 형식 : JSON. 하지만 JSON은 DATE, MAP, SET 처리 못함. 
	// 그래서 SUPERSJON이 안전한 형식을 변환해줌 
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


const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
	// LLM 호출이 많은 'rag.answerQuestion'에 대해서만 속도 제한 적용
	if (path === 'rag.answerQuestion') { 
		try {
			const ip = ctx.headers.get('x-forwarded-for') || '127.0.0.1';  
			const isAllowed = await checkRateLimit(ip);

			if (!isAllowed) {
				throw new TRPCError({
					code: 'TOO_MANY_REQUESTS',
					message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
				});
			}
		} catch (error) {
			// TRPCError는 그대로 throw, 다른 오류는 로그만 기록하고 진행
			if (error instanceof TRPCError) {
				throw error;
			}
			console.error('[Rate Limit Middleware] 오류 발생, rate limiting을 건너뜁니다:', error);
		}
	}
	
	// 속도 제한을 통과하면 다음 단계로 진행
	return next({ ctx });
});

/**
 * 기본 tRPC 함수들
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure.use(rateLimitMiddleware); // 🚨 publicProcedure에 Rate Limiting 미들웨어 적용
// export const protectedProcedure = t.procedure.use(isAuthed); // 인증 미들웨어 추가 가능