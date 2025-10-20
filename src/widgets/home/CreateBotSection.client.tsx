'use client';
import { useState } from 'react';
import CreateBotForm from '@features/bot/create/ui/CreateBotForm.client';

export default function CreateBotSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <button
        className="px-4 py-2 rounded bg-black text-white"
        onClick={() => setOpen(v => !v)}
      >
        {open ? '닫기' : '챗봇 만들기'}
      </button>
      {open && (
        <CreateBotForm
          onCreated={() => {
            setOpen(false);
            location.reload();
          }}
        />
      )}
    </div>
  );
}


