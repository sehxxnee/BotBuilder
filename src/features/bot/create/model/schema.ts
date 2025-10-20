import { z } from 'zod';
export const CreateBotInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  persona: z.string().optional(),
  greeting: z.string().optional(),
  prompt: z.string().optional(),
  language: z.string().optional(),
  tone: z.string().optional(),
});
export type CreateBotInput = z.infer<typeof CreateBotInput>;
