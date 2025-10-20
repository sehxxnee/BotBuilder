import { ok, bad } from '@shared/api/http';
import { getBotById } from '@features/bot/list/server/query';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') throw new Error('message required');
    const bot = await getBotById(params.id);
    if (!bot) return bad('bot not found', 404);
    // TODO: integrate RAG/LLM. For now, echo with bot name.
    const reply = `(${bot.name}) ${message}`;
    return ok({ reply });
  } catch (e: any) {
    return bad(e?.message ?? 'invalid input', 400);
  }
}


