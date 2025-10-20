import { listBots } from '@features/bot/list/server/query';
import CreateBotSection from '@widgets/home/CreateBotSection.client';
import BotCards from '@widgets/dashboard/BotCards';

export default async function Builder() {
  const bots = await listBots();
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Bots</h1>
      <CreateBotSection />
      <BotCards bots={bots} />
    </main>
  );
}
