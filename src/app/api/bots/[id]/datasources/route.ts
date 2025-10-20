import { ok, bad } from '@shared/api/http';
import { addDatasource, addDatasourceFile } from '@features/datasource/add/server/action';
import { DatasourceRepo } from '@entities/datasource/lib/repo.server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const items = await DatasourceRepo.listByBot(params.id);
  return ok(items);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (!(file instanceof File)) throw new Error('file required');
      // In a real app, store file and pass storage key; here we persist filename
      const result = await addDatasourceFile(params.id, { filename: (file as File).name });
      return ok(result, 201);
    }
    const body = await req.json();
    const result = await addDatasource(params.id, body);
    return ok(result, 201);
  } catch (e: any) {
    return bad(e?.message ?? 'invalid input', 400);
  }
}
