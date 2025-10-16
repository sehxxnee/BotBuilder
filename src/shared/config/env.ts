import { z } from 'zod';
const Env = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().min(1),
});
export const env = Env.parse(process.env);
