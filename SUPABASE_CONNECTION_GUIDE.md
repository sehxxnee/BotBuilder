# Supabase 데이터베이스 연결 가이드

## 오류 원인
`Can't reach database server at db.xxxxx.supabase.co:5432` 오류는 Supabase 직접 연결(포트 5432)을 사용할 때 발생하는 일반적인 문제입니다.

## 해결 방법

### 방법 1: Connection Pooler 사용 (권장 ⭐)

Supabase Connection Pooler는 더 안정적이고 IP 화이트리스트가 필요 없습니다.

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **Settings > Database로 이동**
   - Connection string 섹션에서 **"Connection pooling"** 탭 선택
   - **"Transaction"** 또는 **"Session"** 모드 선택 (Transaction 모드 권장)

3. **Connection String 복사**
   - 포트가 `6543`으로 표시되어야 합니다
   - 형식: `postgresql://postgres:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:6543/postgres?pgbouncer=true`

4. **`.env` 파일 업데이트**
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

### 방법 2: Direct Connection + SSL 설정

Direct connection(포트 5432)을 사용해야 하는 경우:

1. **IP 화이트리스트 설정**
   - Supabase 대시보드 > Settings > Database
   - **"Network restrictions"** 섹션에서 IP 추가
   - 개발 환경: `0.0.0.0/0` (모든 IP 허용, 보안 주의)
   - 프로덕션: 특정 IP만 허용

2. **DATABASE_URL에 SSL 파라미터 추가**
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
   ```

### 방법 3: Prisma 스키마에서 SSL 강제

`prisma/schema.prisma` 파일을 수정:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // 마이그레이션용 직접 연결
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}
```

그리고 `.env`에 두 개의 URL 추가:
```env
DATABASE_URL="postgresql://...?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://...?sslmode=require"
```

## 권장 설정 (Production)

```env
# Connection Pooler 사용 (권장)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

## 문제 해결 체크리스트

- [ ] Connection Pooler 사용 (포트 6543)
- [ ] DATABASE_URL에 `?pgbouncer=true` 파라미터 포함
- [ ] SSL 모드 설정 (`?sslmode=require`)
- [ ] Supabase 프로젝트가 활성화되어 있는지 확인
- [ ] 방화벽/VPN이 Supabase 포트를 차단하지 않는지 확인
- [ ] `.env` 파일 변경 후 개발 서버 재시작

## 참고

- **Connection Pooler**: 동시 연결 제한을 관리하고 성능을 향상시킵니다
- **Direct Connection**: 마이그레이션 실행 시 필요할 수 있습니다
- Supabase 무료 플랜: 최대 500개 동시 연결 (Pooler 사용 시)


