# 환경 변수 설정 가이드



## 필수 환경 변수

> **⚠️ 데이터베이스 마이그레이션 필요**
> 
> 인증 기능을 사용하려면 먼저 Prisma 마이그레이션을 실행해야 합니다:
> ```bash
> npm run db:migrate
> ```
> 
> 이 명령어는 `User` 모델과 `Chatbot` 모델의 `userId` 관계를 데이터베이스에 생성합니다.

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

1. **R2 전용 API 토큰 생성 (권장)**
   - Cloudflare 대시보드 접속
   - 왼쪽 메뉴에서 **R2** 선택
   - **Manage R2 API Tokens** 클릭
   - **Create API Token** 클릭
   - 토큰 이름 입력
   - **Object Read & Write** 권한 선택
   - 특정 버킷 또는 모든 버킷 선택
   - **Create API Token** 클릭
   - Access Key ID와 Secret Access Key는 이 시점에만 표시됩니다. 안전한 곳에 보관하세요!

2. **또는 Account API Token 사용 (대안)**
   - Cloudflare 대시보드 → 계정 설정 → **API Tokens**
   - **Create Token** 클릭
   - 권한 설정에서 **Account → Cloudflare R2 → Edit** 선택
   - 토큰 생성 및 Access Key ID, Secret Access Key 복사

**주의:**
- **R2 전용 API 토큰 (R2 > Manage R2 API Tokens)**을 사용하는 것이 **가장 권장됩니다**
- User API Token은 R2 접근에 사용할 수 없습니다
- Account API Token도 사용 가능하지만, R2 전용 토큰이 더 제한적이고 안전합니다

**중요:**
- `R2_ACCESS_KEY_ID`: 일반적으로 **20자 또는 32자**입니다
- `R2_SECRET_ACCESS_KEY`: 일반적으로 **40자**입니다
- **Access Key ID와 Secret Access Key는 반드시 같은 API 토큰 쌍이어야 합니다**
  - 서로 다른 토큰의 Access Key ID와 Secret Access Key를 조합하면 "Access Denied" 오류 발생

**Access Denied 오류 해결:**
1. Cloudflare R2 대시보드에서 새로운 API 토큰 생성
   - R2 > Manage R2 API Tokens > Create API Token
   - **Object Read & Write** 권한 반드시 확인
2. 생성된 토큰의 Access Key ID와 Secret Access Key를 **함께** `.env` 파일에 복사
3. 버킷 이름 확인: R2_BUCKET_NAME이 실제 버킷 이름과 정확히 일치하는지 확인
4. 엔드포인트 확인: `https://[ACCOUNT-ID].r2.cloudflarestorage.com` 형식 확인

**CORS 설정 필수**
브라우저에서 R2에 직접 파일을 업로드하려면 버킷에 CORS 정책을 설정해야 합니다.

1. Cloudflare R2 대시보드 접속
2. 버킷 선택 → Settings 탭
3. CORS Policy 섹션에서 다음 정책 추가:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**설정 예시:**
- `AllowedOrigins`: 개발 환경(`http://localhost:3000`)과 프로덕션 도메인 추가
- `AllowedMethods`: `PUT`, `GET`, `HEAD`포함
- `AllowedHeaders`: `*` 또는 필요한 헤더만 지정

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

### 6. JWT 인증 설정

```env
JWT_SECRET=[YOUR-JWT-SECRET-KEY]
```

**설정 방법:**
- 프로덕션 환경에서는 강력한 랜덤 문자열을 사용하세요.
- 예시 생성 방법:
  ```bash
  # Node.js로 생성
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  
**주의:**
- 프로덕션 환경에서는 반드시 강력한 비밀키를 사용하세요.
- 개발 환경에서는 간단한 문자열도 사용 가능하지만, 프로덕션과는 다른 키를 사용하는 것을 권장합니다.

