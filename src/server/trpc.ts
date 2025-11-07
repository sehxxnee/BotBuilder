import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { getPrismaClient } from '@/server/db'; 
import { redis, checkRateLimit } from '@/server/infrastructure/redis/client';
import { r2Client } from '@/server/infrastructure/r2/client'; 
import { getAuthContext, type AuthContext } from '@/server/infrastructure/auth/middleware';

export const createTRPCContext = async (opts: { headers: Headers }) => {
	const auth = await getAuthContext(opts.headers);
	
	return {
		headers: opts.headers,
		prisma: getPrismaClient(), 
		redis, 
		r2Client, 
		auth,
	};
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
	transformer: superjson, 
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
			if (error instanceof TRPCError) {
				throw error;
			}
		}
	}
	
	return next({ ctx });
});

const isAuthed = t.middleware(async ({ ctx, next }) => {
	if (!ctx.auth) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: '로그인이 필요합니다.',
		});
	}
	return next({
		ctx: {
			...ctx,
			auth: ctx.auth,
		},
	});
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure.use(rateLimitMiddleware);
export const protectedProcedure = t.procedure.use(rateLimitMiddleware).use(isAuthed);