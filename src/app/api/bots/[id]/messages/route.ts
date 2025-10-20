import { ok, bad } from '@shared/api/http';
import { ChatMessageRepo } from '@entities/chatMessage/lib/repo.server';
import { getBotById } from '@features/bot/list/server/query';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const bot = await getBotById(params.id);
    if (!bot) return bad('bot not found', 404);
    const items = await ChatMessageRepo.listByBot(bot.id, 200);
    return ok(items);
  } catch (e: any) {
    return bad(e?.message ?? 'failed', 400);
  }
}


