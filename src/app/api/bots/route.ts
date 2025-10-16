import { ok, bad } from '@shared/api/http';
import { createBot } from '@features/bot/create/server/action';
import { listBots } from '@features/bot/list/server/query';

export async function GET() {
  const bots = await listBots();
  return ok(bots);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bot = await createBot(body);
    return ok(bot, 201);
  } catch (e: any) {
    return bad(e?.message ?? 'invalid input', 400);
  }
}
