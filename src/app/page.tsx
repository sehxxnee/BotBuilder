'use client';

import { ChatbotCreator } from '@/features/chatbot-builder/ChatbotCreator';
import { RealTimeChat } from '@/features/real-time-chat/RealTimeChat';
import { useState } from 'react';

export default function Home() {
  const [currentChatbotId, setCurrentChatbotId] = useState<string | null>(null);
  const [currentChatbotName, setCurrentChatbotName] = useState<string | null>(null);

  const handleChatbotCreated = (id: string, name?: string) => {
    setCurrentChatbotId(id);
    setCurrentChatbotName(name || null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-3xl font-bold mb-8">No-Code RAG Chatbot Builder</h1>
      
      {currentChatbotId ? (
        <div className="w-full max-w-4xl">
          <div className="mb-4">
            <button
              onClick={() => {
                setCurrentChatbotId(null);
                setCurrentChatbotName(null);
              }}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              ← 새 챗봇 만들기
            </button>
          </div>
          <RealTimeChat chatbotId={currentChatbotId} chatbotName={currentChatbotName || undefined} />
        </div>
      ) : (
        <ChatbotCreator onChatbotCreated={handleChatbotCreated} />
      )}
      
    </main>
  );
}