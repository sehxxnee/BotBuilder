import { TRPCError } from '@trpc/server';
import { verifyPassword, generateToken } from '@/server/infrastructure/auth/utils';
import { PrismaClient } from '@prisma/client';

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignInResult {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  token: string;
}

export async function signInUsecase(
  prisma: PrismaClient,
  params: SignInParams
): Promise<SignInResult> {
  const { email, password } = params;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    });
  }

  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    });
  }

  const token = generateToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  };
}
