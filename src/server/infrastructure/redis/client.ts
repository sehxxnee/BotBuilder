import { Redis } from 'ioredis';
import { env } from '@/server/config/env';

const globalForRedis = global as unknown as { redis: Redis | undefined };

const REDIS_URL = env.UPSTASH_REDIS_URL;
const REDIS_TOKEN = env.UPSTASH_REDIS_TOKEN;

export const redis =
  globalForRedis.redis ||
  new Redis(REDIS_URL || '', {
    password: REDIS_TOKEN,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) {
        return null;
      }
      return Math.min(times * 200, 2000);
    },
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


