export const runtime = 'nodejs';
import { ok, bad } from '@shared/api/http';
import { deleteBot } from '@features/bot/delete/server/action';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const result = await deleteBot(params.id);
    return ok(result);
  } catch (e: any) {
    return bad(e?.message ?? 'delete failed', 400);
  }
}


