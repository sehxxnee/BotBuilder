 'use client';
import Link from 'next/link';
export default function BotCards({ bots }: { bots: any[] }) {
  return (
    <section className="grid gap-3">
      {bots.map(b => (
        <Link key={b.id} href={`/dashboard/bots/${b.id}`} className="border rounded p-3 block hover:bg-gray-50">
          <div className="font-semibold">{b.name}</div>
          <div className="text-sm text-gray-500">{b.description || '—'}</div>
          <div className="text-xs mt-1">publicKey: <code>{b.publicKey}</code></div>
          <div className="text-xs">embed: <code>http://localhost:3000/embed/{b.publicKey}</code></div>
        </Link>
      ))}
    </section>
  );
}
