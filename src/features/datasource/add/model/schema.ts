import { z } from 'zod';
export const AddDatasourceInput = z.object({ url: z.string().url() });
export type AddDatasourceInput = z.infer<typeof AddDatasourceInput>;
