// src/server/infrastructure/auth/middleware.ts

import { TRPCError } from '@trpc/server';
import { verifyToken, extractTokenFromHeader } from './utils';
import { getPrismaClient } from '@/server/db';

export interface AuthContext {
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * 인증 미들웨어: 요청에서 사용자 정보를 추출하고 검증합니다.
 */
export async function getAuthContext(headers: Headers): Promise<AuthContext | null> {
  const authHeader = headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    user,
  };
}
