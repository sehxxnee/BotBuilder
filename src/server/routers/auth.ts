// src/server/routers/auth.ts

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/trpc';
import { signUpUsecase } from '@/server/domain/auth/usecases/signUp';
import { signInUsecase } from '@/server/domain/auth/usecases/signIn';

// 입력 스키마 정의
const SignUpInput = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  name: z.string().optional(),
});

const SignInInput = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

export const authRouter = createTRPCRouter({
  /**
   * 회원가입
   */
  signUp: publicProcedure.input(SignUpInput).mutation(async ({ ctx, input }) => {
    return signUpUsecase(ctx.prisma, {
      email: input.email,
      password: input.password,
      name: input.name,
    });
  }),

  /**
   * 로그인
   */
  signIn: publicProcedure.input(SignInInput).mutation(async ({ ctx, input }) => {
    return signInUsecase(ctx.prisma, {
      email: input.email,
      password: input.password,
    });
  }),

  /**
   * 현재 로그인한 사용자 정보 조회
   */
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.auth.user;
  }),
});
