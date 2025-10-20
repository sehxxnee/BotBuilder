'use client';
import { useEffect, useRef, useState } from 'react';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

export default function ChatPanel({ botId }: { botId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/bots/${botId}/messages`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const mapped: Message[] = data.map((m: any) => ({ id: m.id, role: m.role, content: m.content }));
        if (mapped.length === 0) {
          // no history → request greeting seed via chat call with empty ping
          try {
            const r = await fetch(`/api/bots/${botId}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: '' }) });
            if (r.ok) {
              const again = await fetch(`/api/bots/${botId}/messages`, { cache: 'no-store' });
              const after = await again.json();
              setMessages(after.map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
              return;
            }
          } catch {}
        }
        setMessages(mapped);
      }
    })();
  }, [botId]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(`/api/bots/${botId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: data.reply ?? '...' };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded h-[500px] flex flex-col">
      <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map(m => (
          <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className={`inline-block px-3 py-2 rounded ${m.role === 'user' ? 'bg-black text-white' : 'bg-gray-100'}`}>{m.content}</span>
          </div>
        ))}
      </div>
      <div className="p-3 flex gap-2 border-t">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          placeholder="메시지를 입력하세요"
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
        />
        <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" onClick={send} disabled={loading}>
          보내기
        </button>
      </div>
    </div>
  );
}


