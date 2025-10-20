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


