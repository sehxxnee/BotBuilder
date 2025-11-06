// src/server/infrastructure/auth/utils.ts

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/server/config/env';

const SALT_ROUNDS = 10;
const JWT_SECRET = env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * 비밀번호를 해시합니다.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 비밀번호를 검증합니다.
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * JWT 토큰을 생성합니다.
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * JWT 토큰을 검증하고 사용자 ID를 반환합니다.
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Authorization 헤더에서 토큰을 추출합니다.
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}
