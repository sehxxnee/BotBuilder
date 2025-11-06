'use client';

import { ChatbotCreator } from '@/features/chatbot-builder/ChatbotCreator';
import { RealTimeChat } from '@/features/real-time-chat/RealTimeChat';
import { AuthForm } from '@/features/auth/AuthForm';
import { UserMenu } from '@/components/UserMenu';
import { api } from '@/app/trpc/client';
import { useState } from 'react';

export default function Home() {
  const [currentChatbotId, setCurrentChatbotId] = useState<string | null>(null);
  const [currentChatbotName, setCurrentChatbotName] = useState<string | null>(null);
  
  // 현재 로그인한 사용자 확인
  const { data: user, isLoading: isUserLoading, error: userError } = api.auth.getCurrentUser.useQuery(undefined, {
    retry: false,
    // 인증되지 않은 경우 에러를 무시하고 null로 처리
    onError: () => {
      // 인증되지 않은 경우는 정상적인 상태이므로 에러를 무시
    },
  });

  const handleChatbotCreated = (id: string, name?: string) => {
    setCurrentChatbotId(id);
    setCurrentChatbotName(name || null);
  };

  const handleAuthSuccess = () => {
    // 인증 성공 후 페이지 새로고침
    window.location.reload();
  };

  // 사용자 정보 로딩 중
  if (isUserLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-lg">로딩 중...</div>
      </main>
    );
  }

  // 로그인되지 않은 경우
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <AuthForm onSuccess={handleAuthSuccess} />
      </main>
    );
  }

  // 로그인된 경우
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