import { z } from 'zod';
export const AddDatasourceInput = z.object({ url: z.string().url() });
export type AddDatasourceInput = z.infer<typeof AddDatasourceInput>;

export const AddDatasourceFileInput = z.object({ filename: z.string().min(1) });
export type AddDatasourceFileInput = z.infer<typeof AddDatasourceFileInput>;