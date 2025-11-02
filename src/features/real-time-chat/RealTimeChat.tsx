// src/features/real-time-chat/RealTimeChat.tsx
'use client'; // 이 컴포넌트가 클라이언트에서 실행됨을 명시

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { api } from '@/app/trpc/client';
import superjson from 'superjson';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface RealTimeChatProps {
    chatbotId: string;
    chatbotName?: string;
}

export function RealTimeChat({ chatbotId, chatbotName }: RealTimeChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 스크롤을 항상 하단으로 이동
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!input.trim() || isStreaming) {
            return;
        }

        const question = input.trim();
        setInput('');
        
        // 사용자 메시지 추가
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: question,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        // 빈 assistant 메시지 추가 (스트리밍으로 채워질 예정)
        const assistantMessageId = `assistant-${Date.now()}`;
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        setIsStreaming(true);

        try {
            // tRPC 엔드포인트에 직접 fetch 요청 (스트리밍 응답 처리)
            // tRPC는 SuperJSON을 사용하여 직렬화하므로 동일한 형식으로 전송
            const response = await fetch('/api/trpc/rag.answerQuestion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    json: superjson.serialize({
                        chatbotId,
                        question,
                    }),
                }),
            });

            if (!response.ok) {
                throw new Error(`응답 오류: ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error('스트림 응답을 받을 수 없습니다.');
            }

            // ReadableStream에서 데이터 읽기
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                // 청크를 텍스트로 디코딩
                const chunk = decoder.decode(value, { stream: true });
                accumulatedContent += chunk;

                // assistant 메시지 업데이트
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: accumulatedContent }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error('채팅 오류:', error);
            
            // 오류 메시지로 assistant 메시지 업데이트
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? {
                              ...msg,
                              content: `❌ 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                          }
                        : msg
                )
            );
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            {/* 헤더 */}
            <div className="bg-white border-b border-gray-200 p-4">
                <h2 className="text-xl font-bold">
                    {chatbotName || '챗봇'}과 대화하기
                </h2>
                {chatbotId && (
                    <p className="text-sm text-gray-500">ID: {chatbotId}</p>
                )}
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                        안녕하세요! 질문을 입력해주세요.
                    </div>
                ) : (
                    messages.map(message => (
                        <div
                            key={message.id}
                            className={`flex ${
                                message.role === 'user'
                                    ? 'justify-end'
                                    : 'justify-start'
                            }`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                    message.role === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white border border-gray-200 text-gray-800'
                                }`}
                            >
                                <div className="whitespace-pre-wrap break-words">
                                    {message.content || (
                                        <span className="text-gray-400">답변을 생성하는 중...</span>
                                    )}
                                </div>
                                <div
                                    className={`text-xs mt-1 ${
                                        message.role === 'user'
                                            ? 'text-blue-100'
                                            : 'text-gray-500'
                                    }`}
                                >
                                    {message.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="질문을 입력하세요..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isStreaming}
                    />
                    <button
                        type="submit"
                        disabled={isStreaming || !input.trim()}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isStreaming ? '전송 중...' : '전송'}
                    </button>
                </form>
            </div>
        </div>
    );
}

