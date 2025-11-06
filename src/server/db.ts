//Prisma Client 인스턴스가 수백 개씩 생성되는 것을 방지하기 위해 싱글톤 패턴 적용
//이 파일은 싱글톤 인스턴스를 관리하는 파일
 

import { PrismaClient } from '@prisma/client';

// 전역 변수에 PrismaClient 인스턴스를 저장하여 재사용합니다.
// 개발 환경에서 Next.js 핫 리로드 시 클라이언트가 중복 생성되는 것을 방지합니다.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// DATABASE_URL을 강제로 올바른 형식으로 변환하는 함수
function fixDatabaseUrl(): void {
  const originalUrl = process.env.DATABASE_URL || '';
  
  if (!originalUrl) {
    return;
  }
  
  // URL 파싱: 프로토콜, 사용자명, 비밀번호, 호스트, 포트, 경로, 쿼리 파라미터
  const urlPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?(\/[^?]*)?(\?.*)?$/;
  const match = originalUrl.match(urlPattern);
  
  if (!match) {
    return;
  }
  
  const [, originalUser, password, host, port, path, queryParams] = match;
  const databasePath = path || '/postgres';
  const portStr = port || '5432';
  
  // Connection Pooler 형식으로 변환 필요 여부 확인
  const PROJECT_ID = 'lbrpzmzoqprypacgmwnn';
  const CORRECT_USER = `postgres.${PROJECT_ID}`;
  // Supabase Connection Pooler 호스트 형식: aws-{N}-ap-northeast-2.pooler.supabase.com
  // 실제 호스트에서 숫자를 추출하거나, 기본값으로 aws-1 사용
  let poolerHost = `aws-1-ap-northeast-2.pooler.supabase.com`;
  
  // 호스트에서 이미 aws-X 형식이 있으면 숫자 추출 시도
  const hostMatch = host.match(/aws-(\d+)-/);
  if (hostMatch) {
    const awsNumber = hostMatch[1];
    poolerHost = `aws-${awsNumber}-ap-northeast-2.pooler.supabase.com`;
  }
  
  const CORRECT_HOST = poolerHost;
  
  let needsFix = false;
  let correctedUser = originalUser;
  let correctedHost = host;
  let correctedPort = portStr;
  
  // 1. 사용자명 확인 및 수정
  if (originalUser !== CORRECT_USER) {
    // postgres만 있거나 다른 형식이면 수정
    if (originalUser === 'postgres' || !originalUser.includes(PROJECT_ID)) {
      correctedUser = CORRECT_USER;
      needsFix = true;
    }
  }
  
  // 2. 호스트 확인 및 수정 (db.*.supabase.co → aws-0-ap-northeast-2.pooler.supabase.com)
  if (host.includes('.supabase.co') && !host.includes('pooler.supabase.com')) {
    correctedHost = CORRECT_HOST;
    needsFix = true;
  }
  
  // 3. 포트 확인 (Connection Pooler는 보통 5432 또는 6543 사용)
  // Transaction 모드: 5432, Session 모드: 6543
  // 기본적으로 5432 사용 (Transaction 모드가 더 호환성이 좋음)
  if (portStr === '6543') {
    // 6543이면 그대로 유지 (Session 모드)
    correctedPort = '6543';
  } else {
    // 5432 또는 다른 포트면 Transaction 모드로 5432 사용
    correctedPort = '5432';
  }
  
  // 이미 올바른 형식이면 수정하지 않음
  if (!needsFix && originalUser === CORRECT_USER && host.includes('pooler.supabase.com')) {
    return;
  }
  
  // 쿼리 파라미터 설정 (Connection Pooler용)
  // pgbouncer=true가 있으면 유지, 없으면 추가
  let finalQueryParams = queryParams || '';
  if (finalQueryParams) {
    // 기존 쿼리 파라미터에 pgbouncer=true 추가 (없는 경우만)
    if (!finalQueryParams.includes('pgbouncer=true')) {
      const separator = finalQueryParams.includes('?') ? '&' : '?';
      finalQueryParams = `${finalQueryParams}${separator}pgbouncer=true`;
    }
  } else {
    // 쿼리 파라미터가 없으면 pgbouncer=true 추가
    finalQueryParams = '?pgbouncer=true';
  }
  
  // sslmode=require도 추가 (없는 경우만)
  if (!finalQueryParams.includes('sslmode=')) {
    const separator = finalQueryParams.includes('?') ? '&' : '?';
    finalQueryParams = `${finalQueryParams}${separator}sslmode=require`;
  }
  
  // 올바른 URL 생성
  const correctUrl = `postgresql://${correctedUser}:${password}@${correctedHost}:${correctedPort}${databasePath}${finalQueryParams}`;
  
  // 환경 변수 직접 수정 (Prisma Client 초기화 전에 반드시 실행)
  process.env.DATABASE_URL = correctUrl;
}

// DATABASE_URL을 가져오는 함수 (수정된 URL 반환)
function getDatabaseUrl(): string {
  // 먼저 수정 함수 실행
  fixDatabaseUrl();
  // 수정된 DATABASE_URL 반환
  return process.env.DATABASE_URL || '';
}

// Prisma Client 초기화 전에 DATABASE_URL 수정 (매번 실행)
fixDatabaseUrl();

// 개발 환경에서는 전역 캐시를 완전히 무시하고 항상 새로 생성
// Prisma Client는 생성 시점에 process.env.DATABASE_URL을 읽으므로
// fixDatabaseUrl()이 먼저 실행되어야 함
export const prisma = (() => {
  // 개발 환경에서는 전역 캐시 무시
  if (process.env.NODE_ENV === 'development') {
    // 전역 캐시 삭제 (강제 재생성)
    if (globalForPrisma.prisma) {
      try {
        globalForPrisma.prisma.$disconnect();
      } catch {
        // 무시
      }
    }
    (globalForPrisma as { prisma?: PrismaClient }).prisma = undefined;
    
    // DATABASE_URL을 다시 확인하고 수정 (Prisma Client 생성 직전)
    const databaseUrl = getDatabaseUrl();
    
    // 새 Prisma Client 생성 - 명시적으로 DATABASE_URL 전달
    return new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: ['error'],
    });
  }
  
  // 프로덕션 환경에서는 싱글톤 패턴 유지
  if (!globalForPrisma.prisma) {
    const databaseUrl = getDatabaseUrl();
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: ['error'],
  });
  }
  return globalForPrisma.prisma;
})();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Prisma 연결 오류를 처리하되, 초기화 시점에는 연결을 시도하지 않음
// 실제 쿼리 실행 시점에 연결이 이루어짐


// 이 파일의 'prisma' 인스턴스가 이제 '@/server/db' 경로를 통해 가져와집니다.
// 하지만 개발 환경에서는 항상 최신 DATABASE_URL을 사용하도록 보장
export function getPrismaClient(): typeof prisma {
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경에서는 매번 최신 DATABASE_URL 확인 및 Prisma Client 재생성
    const databaseUrl = getDatabaseUrl();
    
    // Prisma Client를 다시 생성 (항상 최신 DATABASE_URL 사용)
    const newPrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: ['error'],
    });
    
    return newPrisma;
  }
  
  return prisma;
}