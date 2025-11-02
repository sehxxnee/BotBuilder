//Prisma Client 인스턴스가 수백 개씩 생성되는 것을 방지하기 위해 싱글톤 패턴 적용
//이 파일은 싱글톤 인스턴스를 관리하는 파일
 

import { PrismaClient } from '@prisma/client';

// 전역 변수에 PrismaClient 인스턴스를 저장하여 재사용합니다.
// 개발 환경에서 Next.js 핫 리로드 시 클라이언트가 중복 생성되는 것을 방지합니다.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 이 파일의 'prisma' 인스턴스가 이제 '@/server/db' 경로를 통해 가져와집니다.