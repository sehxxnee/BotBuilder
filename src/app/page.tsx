'use client';

import { ChatbotCreator } from '@/features/chatbot-builder/ChatbotCreator'; // 🚨 새로운 경로에서 import
import { useState } from 'react';

export default function Home() {
  const [currentChatbotId, setCurrentChatbotId] = useState<string | null>(null);

  const handleChatbotCreated = (id: string) => {
    setCurrentChatbotId(id);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-3xl font-bold mb-8">No-Code RAG Chatbot Builder</h1>
      
      {currentChatbotId ? (
        // 챗봇이 생성되면 채팅 컴포넌트를 보여줍니다.
        <div className="w-full max-w-2xl">
          <h2 className="text-xl mb-4">Chatbot ID: {currentChatbotId}</h2>
          {/* 🚨 다음 단계에서 구현할 RealTimeChat 컴포넌트가 들어갈 위치 */}
          {/* <RealTimeChat chatbotId={currentChatbotId} /> */}
          <p className="text-gray-500">채팅 컴포넌트가 곧 여기에 표시됩니다.</p>
        </div>
      ) : (
        // 챗봇이 없을 때는 생성 컴포넌트를 보여줍니다.
        <ChatbotCreator onChatbotCreated={handleChatbotCreated} />
      )}
      
    </main>
  );
}