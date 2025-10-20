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
      {/* Modal */}
      <div
        className={
          `fixed inset-0 z-50 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`
        }
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className={
            `absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`
          }
          onClick={() => setOpen(false)}
        />
        {/* Panel */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className={
              `w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl transition-all duration-200
              ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`
            }
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-semibold">챗봇 만들기</h2>
              <button
                aria-label="닫기"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <CreateBotForm
              onCreated={() => {
                setOpen(false);
                location.reload();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


