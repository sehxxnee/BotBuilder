# 환경 변수 설정 가이드



## 필수 환경 변수

### 1.Supabase 데이터베이스 연결  

```env
# Supabase Connection Pooler를 사용합니다. 
# Session 모드: 포트 6543
DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[YOUR-PASSWORD]@aws-[N]-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 또는 Transaction 모드: 포트 5432
# DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[YOUR-PASSWORD]@aws-[N]-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true"
```

**설정 방법:**
1. Supabase 대시보드 접속 → Settings > Database
2. Connection pooling 탭 선택
3. Connection string 복사
4. `[PROJECT_ID]`, `[YOUR-PASSWORD]`, `[N]` 값을 실제 값으로 교체

**중요:**
- 사용자명 형식은 `postgres.[PROJECT_ID]` 형식이어야 합니다.
- 호스트는 `pooler.supabase.com` 형식이어야 합니다.
- `pgbouncer=true` 파라미터가 포함되어야 합니다.

### 2. Supabase 클라이언트 설정

```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

**설정 방법:**
- Supabase 대시보드 → Settings > API
- Project URL과 anon/public key 복사

### 3. Cloudflare R2 설정

```env
R2_ENDPOINT=https://[ACCOUNT-ID].r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=[YOUR-ACCESS-KEY-ID]
R2_SECRET_ACCESS_KEY=[YOUR-SECRET-ACCESS-KEY]
R2_BUCKET_NAME=[YOUR-BUCKET-NAME]
```

**설정 방법:**
- Cloudflare R2 대시보드 접속
- API Tokens에서 Access Key ID와 Secret Access Key 생성
- Endpoint와 Bucket Name 확인

### 4. Upstash Redis 설정

```env
UPSTASH_REDIS_URL=https://[YOUR-REDIS-ENDPOINT]
UPSTASH_REDIS_TOKEN=[YOUR-REDIS-TOKEN]
```

**설정 방법:**
- Upstash 대시보드 접속
- Redis 데이터베이스 생성
- REST API URL과 Token 복사

### 5. Groq API 설정

```env
GROQ_API_KEY=[YOUR-GROQ-API-KEY]
```

**설정 방법:**
- Groq 대시보드 접속: https://console.groq.com/
- API Keys에서 새 API Key 생성

 

