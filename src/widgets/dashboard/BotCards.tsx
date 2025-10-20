 'use client';
import Link from 'next/link';
export default function BotCards({ bots }: { bots: any[] }) {
  return (
    <section className="grid gap-3">
      {bots.map(b => (
        <div key={b.id} className="border rounded p-3 hover:bg-gray-50">
          <Link href={`/dashboard/bots/${b.id}`} className="block">
            <div className="font-semibold">{b.name}</div>
            <div className="text-sm text-gray-500">{b.description || '—'}</div>
            <div className="text-xs mt-1">publicKey: <code>{b.publicKey}</code></div>
            <div className="text-xs">embed: <code>http://localhost:3000/embed/{b.publicKey}</code></div>
          </Link>
          <div className="mt-2 flex justify-end">
            <button
              className="text-red-600 text-sm"
              onClick={async (e) => {
                e.preventDefault();
                if (!confirm('정말 삭제하시겠어요?')) return;
                const res = await fetch(`/api/bots/${b.id}`, { method: 'DELETE' });
                if (res.ok) location.reload();
                else alert('삭제 실패');
              }}
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
