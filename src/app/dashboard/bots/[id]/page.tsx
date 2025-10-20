import { getBotById } from '@features/bot/list/server/query';
import ChatPanel from '@widgets/chat/ChatPanel.client';

export default async function BotChatPage({ params }: { params: { id: string } }) {
  const bot = await getBotById(params.id);
  if (!bot) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Bot not found</h1>
      </main>
    );
  }
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{bot.name}</h1>
      <ChatPanel botId={bot.id} />
    </main>
  );
}


