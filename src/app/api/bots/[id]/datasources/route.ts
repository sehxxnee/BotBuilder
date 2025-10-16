import { ok, bad } from '@shared/api/http';
import { addDatasource } from '@features/datasource/add/server/action';
import { DatasourceRepo } from '@entities/datasource/lib/repo.server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const items = await DatasourceRepo.listByBot(params.id);
  return ok(items);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const result = await addDatasource(params.id, body);
    return ok(result, 201);
  } catch (e: any) {
    return bad(e?.message ?? 'invalid input', 400);
  }
}
