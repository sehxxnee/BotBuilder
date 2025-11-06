// src/server/domain/auth/usecases/signUp.ts

import { TRPCError } from '@trpc/server';
import { hashPassword, generateToken } from '@/server/infrastructure/auth/utils';
import { PrismaClient } from '@prisma/client';

export interface SignUpParams {
  email: string;
  password: string;
  name?: string;
}

export interface SignUpResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  };
  token: string;
}

export async function signUpUsecase(
  prisma: PrismaClient,
  params: SignUpParams
): Promise<SignUpResult> {
  try {
    const { email, password, name } = params;

    // 이미 존재하는 이메일인지 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: '이미 존재하는 이메일입니다.',
      });
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // JWT 토큰 생성
    const token = generateToken(user.id);

    return {
      user,
      token,
    };
  } catch (error) {
    console.error('[signUpUsecase] 오류:', error);
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `회원가입 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    });
  }
}
