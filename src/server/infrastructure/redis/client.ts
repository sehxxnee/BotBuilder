import { Redis, RedisOptions } from 'ioredis';
import { env } from '@/server/config/env';

const globalForRedis = global as unknown as { redis: Redis | undefined };

const REDIS_URL = env.UPSTASH_REDIS_URL;
const REDIS_TOKEN = env.UPSTASH_REDIS_TOKEN;

/**
 * 공통 Redis 설정 옵션
 */
const getBaseRedisOptions = (): Partial<RedisOptions> => ({
  password: REDIS_TOKEN,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 200, 2000);
  },
});

/**
 * Redis 클라이언트 팩토리 함수
 * @param options 추가 옵션 (lazyConnect 등)
 */
export function createRedisClient(options: Partial<RedisOptions> = {}): Redis {
  return new Redis(REDIS_URL || '', {
    ...getBaseRedisOptions(),
    ...options,
  });
}

/**
 * 서버용 Redis 클라이언트 (싱글톤, lazyConnect)
 * Next.js 서버리스 환경에서 사용
 */
export const redis =
  globalForRedis.redis ||
  createRedisClient({
    lazyConnect: true,
  });

redis.on('error', () => {
  // silent
});

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

const RATE_LIMIT_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 10;

export async function checkRateLimit(key: string): Promise<boolean> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return true;
  }

  try {
    const pipe = redis.pipeline();
    const redisKey = `rate_limit:${key}`;
    pipe.incr(redisKey);
    pipe.expire(redisKey, RATE_LIMIT_SECONDS);
    const results = await pipe.exec();
    if (!results) return true;
    const currentCount = results[0]?.[1] as number | undefined;
    if (currentCount === undefined || currentCount > RATE_LIMIT_MAX_REQUESTS) return false;
    return true;
  } catch {
    return true;
  }
}


