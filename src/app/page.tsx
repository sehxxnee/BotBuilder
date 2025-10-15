'use client';
import { useEffect, useState } from 'react';

type Bot = { id: string; name: string; createdAt: string };

export default function Builder() {
  const [bots, setBots] = useState<Bot[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/bots', { cache: 'no-store' });
      setBots(await res.json());
    })();
  }, []);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Bots</h1>
      <ul className="space-y-2">
        {bots.map(b => (
          <li key={b.id} className="border rounded p-3">
            <div className="font-medium">{b.name}</div> 
            <div className="text-sm text-gray-500">{new Date(b.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
