

import Groq from 'groq-sdk';
import { ReadableStream } from 'stream/web'; // Node.js 환경에서 스트림을 사용하기 위해 필요

// 🚨 환경 변수 로드 방식 수정: process.env 대신 직접 접근
// Next.js 환경에서는 process.env가 바로 사용 가능하므로, 
// Groq 클라이언트가 .env의 GROQ_API_KEY를 직접 읽도록 초기화합니다.
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY, 
});

// --- 1. 임베딩 모델 정의 및 Mock 로직 ---

// Groq는 자체 임베딩 API를 제공하지 않으므로, RAG 테스트를 위해 Mock 벡터를 반환합니다.
// 이 벡터의 차원(768)은 일반적인 임베딩 모델(예: bge-small, text-embedding-3-small)에 맞춰 조정했습니다.
const MOCK_VECTOR_DIMENSION = 768; 

/**
 * 🤖 [임시 구현] 사용자 질문을 벡터로 변환
 * * @param text - 임베딩할 텍스트
 * @returns Mock 벡터 배열 (number[])
 */
export async function createEmbedding(text: string): Promise<number[]> {
    // ⚠️ 실제 서비스에서는 여기에 OpenAI나 Cohere 등의 임베딩 전용 API 호출 로직이 들어가야 합니다.
    if (!text || text.length === 0) {
        return [];
    }
    
    // API 호출 없이 임시(Mock) 벡터 반환
    console.warn("⚠️ MOCK EMBEDDING: Groq SDK가 임베딩을 지원하지 않아 Mock 벡터를 반환합니다.");
    return Array.from({ length: MOCK_VECTOR_DIMENSION }, () => Math.random());
}


// --- 2. RAG 기반 스트리밍 답변 생성 ---

const GENERATION_MODEL = 'mixtral-8x7b-32768'; // 빠르고 강력한 Groq 모델 추천

/**
 * 💬 RAG와 결합된 스트리밍 답변 생성 (rag.ts에서 호출)
 * * @param systemPrompt - 챗봇의 기본 역할 지침 (rag.ts에서 RAG 컨텍스트 포함)
 * @param question - 사용자 질문
 * @returns ReadableStream 객체
 */
export async function generateStreamingResponse(
    systemPrompt: string, // rag.ts에서 이미 컨텍스트가 포함된 최종 시스템 프롬프트
    question: string
): Promise<ReadableStream> {
    
    try {
        const stream = await groq.chat.completions.create({
            model: GENERATION_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question },
            ],
            temperature: 0.2, 
            stream: true, 
        });
        
        // Groq SDK 스트림을 Next.js에서 사용할 수 있는 ReadableStream으로 변환
        const encoder = new TextEncoder();
        
        return new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        controller.enqueue(encoder.encode(content));
                    }
                }
                controller.close();
            },
        }) as ReadableStream;

    } catch (error) {
        console.error('Groq Streaming Error:', error);
        throw new Error('Groq API 응답을 생성할 수 없습니다. (API 키, 네트워크 확인)');
    }
}