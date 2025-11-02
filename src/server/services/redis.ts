//Redis 클라이언트 : 싱글톤으로 제작
//기능 : 데이터베이스와의 영구적인 tcp 연결 -> 따라서 단 하나의 인스턴스만 생성되도록 싱글톤으로 제작


import { Redis } from 'ioredis';
 
const globalForRedis = global as unknown as { redis: Redis | undefined };  
 
export const redis =
  globalForRedis.redis ||
  new Redis(process.env.UPSTASH_REDIS_URL!, {
    password: process.env.UPSTASH_REDIS_TOKEN,  
    maxRetriesPerRequest: null, 
    enableReadyCheck: false,
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
    const pipe = redis.pipeline();
    const redisKey = `rate_limit:${key}`;
 
    pipe.incr(redisKey); 
    pipe.expire(redisKey, RATE_LIMIT_SECONDS);

    // 두 명령을 한 번의 왕복으로 처리 
    const results = await pipe.exec();
    
    // 결과 배열에서 INCR의 결과를 추출
    // results: [[null, 1], [null, 1]] 형태, 두 번째 요소가 명령어의 결과
    const currentCount = results?.[0]?.[1] as number | undefined;
 
    if (currentCount === undefined || currentCount > RATE_LIMIT_MAX_REQUESTS) {
        return false; // 차단  
    }

    return true; // 허용
}