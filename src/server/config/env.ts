import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').optional(),

  R2_ENDPOINT: z.string().min(1, 'R2_ENDPOINT is required').optional(),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required').optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required').optional(),
  R2_BUCKET_NAME: z.string().min(1, 'R2_BUCKET_NAME is required').optional(),

  UPSTASH_REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),

  GROQ_API_KEY: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

export const env = parsed.success
  ? (parsed.data as z.infer<typeof EnvSchema>)
  : ({} as z.infer<typeof EnvSchema>);


