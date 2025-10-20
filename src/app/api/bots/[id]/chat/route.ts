export const runtime = 'nodejs';
import { ok, bad } from '@shared/api/http';
import { getBotById } from '@features/bot/list/server/query';
import { generateRagReply } from '@features/chat/rag/server/service';
import { ChatMessageRepo } from '@entities/chatMessage/lib/repo.server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') throw new Error('message required');
    const bot = await getBotById(params.id);
    if (!bot) return bad('bot not found', 404);
    const history = await ChatMessageRepo.listByBot(bot.id, 1);
    if (history.length === 0) {
      // seed greeting if no history
      let settings: { greeting?: string } = {};
      try { settings = JSON.parse(bot.settingsJson || '{}'); } catch {}
      const greeting = settings.greeting || '안녕하세요! 무엇을 도와드릴까요?';
      await ChatMessageRepo.create({ botId: bot.id, role: 'assistant', content: greeting });
    }
    await ChatMessageRepo.create({ botId: bot.id, role: 'user', content: message });
    const { reply } = await generateRagReply(bot.id, message);
    await ChatMessageRepo.create({ botId: bot.id, role: 'assistant', content: reply });
    return ok({ reply });
  } catch (e: any) {
    return bad(e?.message ?? 'invalid input', 400);
  }
}


