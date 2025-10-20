'use client';
import { useState } from 'react';

export default function CreateBotForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState(''), [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false), [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    if (!name.trim()) return setErr('Name is required');
    setLoading(true);
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ name, description: desc }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Create failed');
      setName(''); setDesc('');
      onCreated?.();
    } catch (e:any) {
      setErr(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2 items-start">
      <input className="border rounded px-3 py-2" placeholder="Bot name"
             value={name} onChange={e=>setName(e.target.value)} />
      <input className="border rounded px-3 py-2 flex-1" placeholder="Description"
             value={desc} onChange={e=>setDesc(e.target.value)} />
      <button onClick={submit} disabled={loading}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
        {loading ? 'Creating...' : 'Create'}
      </button>
      {err && <span className="text-red-600 text-sm">{err}</span>}
    </div>
  );
}
