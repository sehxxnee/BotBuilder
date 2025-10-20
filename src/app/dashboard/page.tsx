import { listBots } from '@features/bot/list/server/query';
import CreateBotForm from '@features/bot/create/ui/CreateBotForm.client';
import BotCards from '@widgets/dashboard/BotCards';

export default async function DashboardPage() {
  const bots = await listBots(); // 서버 컴포넌트에서 SSR 데이터 패칭
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Bots</h1>
      <CreateBotForm onCreated={() => { /* 서버 액션 없으니 새로고침으로 간단 처리 */ location.reload(); }} />
      <BotCards bots={bots} />
    </main>
  );
}
