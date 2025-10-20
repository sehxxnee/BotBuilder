'use client';
import { useState } from 'react';

export default function CreateBotForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState(''), [desc, setDesc] = useState('');
  const [persona, setPersona] = useState('');
  const [greeting, setGreeting] = useState('');
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('ko');
  const [tone, setTone] = useState('neutral');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false), [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    if (!name.trim()) return setErr('Name is required');
    setLoading(true);
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ name, description: desc, persona, greeting, prompt, language, tone }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Create failed');
      const bot = await res.json();
      // upload files if any
      if (files && files.length > 0) {
        for (const f of Array.from(files)) {
          const form = new FormData();
          form.append('file', f);
          const up = await fetch(`/api/bots/${bot.id}/datasources`, { method: 'POST', body: form });
          if (!up.ok) throw new Error('File upload failed');
        }
      }
      setName(''); setDesc(''); setPersona(''); setGreeting(''); setPrompt(''); setFiles(null);
      onCreated?.();
    } catch (e:any) {
      setErr(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2 w-full max-w-3xl">
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2 flex-1" placeholder="봇 이름"
               value={name} onChange={e=>setName(e.target.value)} />
        <input className="border rounded px-3 py-2 flex-1" placeholder="설명"
               value={desc} onChange={e=>setDesc(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2 flex-1" placeholder="챗봇 성격/생김새(페르소나)"
               value={persona} onChange={e=>setPersona(e.target.value)} />
        <input className="border rounded px-3 py-2 flex-1" placeholder="시작 인사말"
               value={greeting} onChange={e=>setGreeting(e.target.value)} />
      </div>
      <textarea className="border rounded px-3 py-2 min-h-[80px]" placeholder="프롬프트"
                value={prompt} onChange={e=>setPrompt(e.target.value)} />
      <div className="flex gap-2">
        <select className="border rounded px-3 py-2" value={language} onChange={e=>setLanguage(e.target.value)}>
          <option value="ko">Korean</option>
          <option value="en">English</option>
          <option value="ja">Japanese</option>
        </select>
        <select className="border rounded px-3 py-2" value={tone} onChange={e=>setTone(e.target.value)}>
          <option value="neutral">Neutral</option>
          <option value="friendly">Friendly</option>
          <option value="professional">Professional</option>
        </select>
        <input type="file" multiple onChange={e=>setFiles(e.target.files)} />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={submit} disabled={loading}
                className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
          {loading ? 'Creating...' : 'Create'}
        </button>
        {err && <span className="text-red-600 text-sm">{err}</span>}
      </div>
    </div>
  );
}
