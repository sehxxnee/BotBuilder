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
