import { z } from 'zod';
export const CreateBotInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
export type CreateBotInput = z.infer<typeof CreateBotInput>;
