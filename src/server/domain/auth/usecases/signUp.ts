import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
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
  const { email, password, name } = params;

  const hashedPassword = await hashPassword(password);

  try {
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

    const token = generateToken(user.id);

    return {
      user,
      token,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '이미 존재하는 이메일입니다.',
        });
      }
    }
    
    if (error instanceof TRPCError) {
      throw error;
    }
    
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `회원가입 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    });
  }
}
