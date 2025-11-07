'use client';

import { ChatbotCreator } from '@/features/chatbot-builder/ChatbotCreator';
import { RealTimeChat } from '@/features/real-time-chat/RealTimeChat';
import { AuthForm } from '@/features/auth/AuthForm';
import { UserMenu } from '@/components/UserMenu';
import { api } from '@/app/trpc/client';
import { useState } from 'react';

export default function AppHome() {
  const [currentChatbotId, setCurrentChatbotId] = useState<string | null>(null);
  const [currentChatbotName, setCurrentChatbotName] = useState<string | null>(null);
  const { data: user, isLoading: isUserLoading } = api.auth.getCurrentUser.useQuery(undefined, {
    retry: false,
    onError: () => {},
  });

  const handleChatbotCreated = (id: string, name?: string) => {
    setCurrentChatbotId(id);
    setCurrentChatbotName(name || null);
  };

  const handleAuthSuccess = () => {
    window.location.reload();
  };

  if (isUserLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-lg">로딩 중...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <AuthForm onSuccess={handleAuthSuccess} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-6xl mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">No-Code RAG Chatbot Builder</h1>
        <UserMenu />
      </div>
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



