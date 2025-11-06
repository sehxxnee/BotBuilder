// src/server/infrastructure/redis/jobStatus.ts

import type { Redis } from 'ioredis';

export interface JobStatus {
  jobId: string;
  status: string;
  attempt?: number;
  nextRunAt?: number;
  successChunks?: number;
  totalChunks?: number;
  lastError?: string;
  updatedAt?: string;
}

export async function getJobStatus(redis: Redis, jobId: string): Promise<JobStatus> {
  const key = `job:${jobId}`;
  const data = await redis.hgetall(key);
  
  if (!data || Object.keys(data).length === 0) {
    return { jobId, status: 'unknown' };
  }
  
  return {
    jobId,
    status: data.status || 'unknown',
    attempt: data.attempt ? Number(data.attempt) : undefined,
    nextRunAt: data.nextRunAt ? Number(data.nextRunAt) : undefined,
    successChunks: data.successChunks ? Number(data.successChunks) : undefined,
    totalChunks: data.totalChunks ? Number(data.totalChunks) : undefined,
    lastError: data.lastError || undefined,
    updatedAt: data.updatedAt || undefined,
  };
}
