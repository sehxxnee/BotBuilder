//Redis 클라이언트 : 싱글톤으로 제작
//기능 : 데이터베이스와의 영구적인 tcp 연결 -> 따라서 단 하나의 인스턴스만 생성되도록 싱글톤으로 제작


import { Redis } from 'ioredis';
 
const globalForRedis = global as unknown as { redis: Redis | undefined };  

// 환경 변수 확인
const REDIS_URL = process.env.UPSTASH_REDIS_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_TOKEN;

 
export const redis =
  globalForRedis.redis ||
  new Redis(REDIS_URL || '', {
    password: REDIS_TOKEN,  
    maxRetriesPerRequest: null, 
    enableReadyCheck: false,
    lazyConnect: true, // 즉시 연결하지 않고 필요할 때 연결
    // 연결 실패 시 재시도 설정
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // 재시도 중단
      }
      return Math.min(times * 200, 2000); // 최대 2초 대기
    },
  });

// Redis 연결 오류 처리
redis.on('error', () => {
  // 에러는 조용히 처리
  });
 
if (process.env.NODE_ENV !== 'production') { 
  globalForRedis.redis = redis; 
}
 
const RATE_LIMIT_SECONDS = 60;  
const RATE_LIMIT_MAX_REQUESTS = 10;  

/**
 *  요청에 대해 Redis 기반의 Rate Limiting을 수행하는 코드
 * @param key - 요청자를 식별하는 키 
 * @returns 허용 여부  
 */
export async function checkRateLimit(key: string): Promise<boolean> {
    // Redis 환경 변수가 없으면 rate limiting을 건너뛰고 허용
    if (!REDIS_URL || !REDIS_TOKEN) {
        return true; // Redis가 없으면 기본적으로 허용
    }

    try {
    const pipe = redis.pipeline();
    const redisKey = `rate_limit:${key}`;
 
    pipe.incr(redisKey); 
    pipe.expire(redisKey, RATE_LIMIT_SECONDS);

    // 두 명령을 한 번의 왕복으로 처리 
    const results = await pipe.exec();
        
        // results가 null이면 Redis 연결 실패
        if (!results) {
            return true; // 연결 실패 시 허용
        }
    
    // 결과 배열에서 INCR의 결과를 추출
    // results: [[null, 1], [null, 1]] 형태, 두 번째 요소가 명령어의 결과
        const currentCount = results[0]?.[1] as number | undefined;
 
    if (currentCount === undefined || currentCount > RATE_LIMIT_MAX_REQUESTS) {
        return false; // 차단  
    }

    return true; // 허용
    } catch (error) {
        // Redis 오류 발생 시 기본적으로 허용
        return true; // 오류 발생 시 허용
    }
}