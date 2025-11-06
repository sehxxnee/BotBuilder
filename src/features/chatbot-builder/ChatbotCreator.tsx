// src/features/chatbot-builder/ChatbotCreator.tsx
'use client'; // 이 컴포넌트가 클라이언트에서 실행됨을 명시

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { api } from '@/app/trpc/client'; // tRPC API 훅 import

interface ChatbotCreatorProps {
    onChatbotCreated: (chatbotId: string, name?: string) => void;
}

export function ChatbotCreator({ onChatbotCreated }: ChatbotCreatorProps) {
    const [name, setName] = useState('');
    const [prompt, setPrompt] = useState('You are a helpful and concise AI assistant.');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState('챗봇 이름과 지식 파일을 선택하세요.');
    const [jobId, setJobId] = useState<string | null>(null);

    // --- tRPC 뮤테이션 훅 정의 ---
    const createChatbotMutation = api.rag.createChatbot.useMutation();
    const uploadFileMutation = api.rag.uploadFile.useMutation();
    const processFileMutation = api.rag.processFile.useMutation();

    // 업로드 이후 작업 상태 폴링 (jobId가 있을 때만 활성화)
    const processStatusQuery = api.rag.getProcessStatus.useQuery(
        { jobId: jobId || '' },
        {
            enabled: !!jobId,
            refetchInterval: 1500,
            refetchOnWindowFocus: false,
        }
    );

    // 모든 뮤테이션의 로딩 상태를 통합하여 버튼 비활성화에 사용
    // tRPC v11에서는 isLoading 대신 isPending 사용
    const isLoading = createChatbotMutation.isPending || uploadFileMutation.isPending || processFileMutation.isPending;


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // MIME 타입 검증을 위한 예시 (백엔드의 Zod 검증을 보조)
            if (!selectedFile.type.startsWith('application/') && !selectedFile.type.startsWith('text/')) {
                setStatus('❌ 문서 파일(PDF, TXT, DOCX 등)만 업로드 가능합니다.');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setStatus(`파일 선택됨: ${selectedFile.name}`);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name || !file) {
            setStatus('챗봇 이름과 파일을 모두 입력해주세요.');
            return;
        }

        setStatus('1/4. 챗봇 생성 중 (DB 등록)...');
        let chatbotId = '';

        try {
            // 1. 챗봇 생성 (DB에 챗봇 정보 기록)
            const newChatbot = await createChatbotMutation.mutateAsync({ name, systemPrompt: prompt });
            chatbotId = newChatbot.id;
            onChatbotCreated(chatbotId, name); // 생성 후 메인 페이지에 ID와 이름 전달

            // 2. 파일을 Base64로 변환
            setStatus('2/4. 파일 준비 중...');
            const fileBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    // data:application/...;base64,XXXXXXXX 형식에서 base64 부분만 추출
                    const result = reader.result as string;
                    const base64Data = result.split(',')[1];
                    resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // 3. 백엔드를 통한 파일 업로드 (CORS 문제 회피)
            setStatus('3/4. 파일 Cloudflare R2에 업로드 중...');
            const { fileKey } = await uploadFileMutation.mutateAsync({
                fileName: file.name,
                fileType: file.type,
                fileData: fileBase64,
            });

            // 4. 비동기 파일 처리 큐에 등록 (Redis Queue 사용)
            setStatus('4/4. 파일 처리 작업을 큐에 등록 중...');
            const processResult = await processFileMutation.mutateAsync({
                chatbotId,
                fileKey,
                fileName: file.name,
            });
            if (processResult && 'jobId' in processResult) {
                setJobId(processResult.jobId as string);
            }

            setStatus(`✅ 챗봇 생성 및 학습 작업 시작됨! 처리 상태는 아래에서 실시간으로 확인할 수 있어요.`);

        } catch (error) {
            console.error('챗봇 생성 오류:', error);
            
            // tRPC 오류인 경우 더 자세한 정보 출력
            if (error && typeof error === 'object' && 'data' in error) {
                console.error('tRPC 오류 상세:', error);
            }
            
            // 오류 발생 시 챗봇과 파일 데이터를 정리하는 추가 로직 필요
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
            setStatus(`❌ 오류 발생: ${errorMessage}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 border rounded-lg max-w-lg mx-auto shadow-xl bg-white">
            <h2 className="text-2xl font-extrabold mb-6 text-indigo-700">🤖 No-Code 챗봇 빌더</h2>
            <div className="space-y-4">
                
                {/* 챗봇 이름 입력 */}
                <div>
                    <label className="block mb-1 font-semibold text-gray-700">챗봇 이름:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        placeholder="예: 우리 회사 FAQ 봇"
                    />
                </div>
                
                {/* 시스템 프롬프트 (페르소나) 입력 */}
                <div>
                    <label className="block mb-1 font-semibold text-gray-700">시스템 프롬프트 (페르소나):</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded h-24 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        required
                        placeholder="예: 당신은 항상 친절하게 고객 문제를 해결하는 전문가입니다."
                    />
                </div>
                
                {/* 지식 파일 업로드 */}
                <div>
                    <label className="block mb-1 font-semibold text-gray-700">지식 파일 (RAG 소스):</label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        required
                        accept=".pdf,.txt,.md,.docx" // 허용 파일 형식 지정
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-indigo-600 text-white p-3 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-gray-400"
            >
                {isLoading ? '처리 중...' : '챗봇 생성 및 학습 시작'}
            </button>
            <p className={`mt-4 text-sm ${status.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
                {status}
            </p>
            {jobId && (
                <div className="mt-4 p-3 border rounded bg-gray-50">
                    <div className="text-sm text-gray-700 font-semibold">작업 ID: <span className="font-mono">{jobId}</span></div>
                    {processStatusQuery.isLoading && (
                        <div className="text-sm text-gray-600 mt-1">상태 조회 중...</div>
                    )}
                    {processStatusQuery.data && (
                        <div className="mt-2 space-y-1">
                            <div className="text-sm">
                                상태: <span className="font-semibold">{processStatusQuery.data?.status || 'unknown'}</span>
                                {(processStatusQuery.data?.attempt || 0) > 0 && (
                                    <span className="ml-2 text-xs text-gray-500">(재시도 {processStatusQuery.data?.attempt}회)</span>
                                )}
                            </div>
                            {((processStatusQuery.data?.totalChunks || 0) > 0) && (
                                <div>
                                    <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                                        <div
                                            className="bg-indigo-600 h-2"
                                            style={{ width: `${Math.min(100, Math.round((((processStatusQuery.data?.successChunks || 0) / (processStatusQuery.data?.totalChunks || 1)) * 100)))}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        {(processStatusQuery.data?.successChunks || 0)} / {(processStatusQuery.data?.totalChunks || 0)}
                                    </div>
                                </div>
                            )}
                            {processStatusQuery.data?.lastError && (
                                <div className="text-xs text-red-600 wrap-break-word">최근 오류: {processStatusQuery.data?.lastError}</div>
                            )}
                            {processStatusQuery.data?.nextRunAt && (
                                <div className="text-xs text-gray-600">
                                    다음 재시도 예정: {new Date(processStatusQuery.data?.nextRunAt).toLocaleString()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </form>
    );
}