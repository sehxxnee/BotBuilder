import { listBots } from '@features/bot/list/server/query';

export default async function DashboardPage() {
  const bots = await listBots();
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Bots</h1>
      <pre className="text-sm bg-gray-50 p-3 rounded">{JSON.stringify(bots, null, 2)}</pre>
    </main>
  );
}
