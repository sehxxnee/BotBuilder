// src/server/services/groq.ts

import { Groq } from 'groq-sdk';

// 🚨 Groq API 키는 .env 파일에서 가져옵니다.
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, 
});

// Groq 모델명을 정의 (더 빠른 추론 속도와 RAG에 적합한 모델을 선택)
const GENERATION_MODEL = 'llama3-70b-8192'; 
const EMBEDDING_MODEL = 'text-embedding-3-small'; 
// Groq는 embedding 모델을 직접 제공하지 않으므로, 이 부분을 위한 별도 서비스(예: OpenAI)가 필요하거나, 
// Groq의 Chat Completions API를 임베딩 대체 용도로 사용해야 할 수 있습니다. 
// 여기서는 임베딩 기능은 별도의 서비스가 있다고 가정하고, 일단 Groq는 생성을 담당하도록 합니다.

// 임베딩 서비스가 필요하다는 점을 가정하고, 임시 함수로 대체
export async function createEmbedding(text: string): Promise<number[]> {
  // 🚨 실제로는 임베딩 전용 서비스(예: OpenAI)의 API를 호출해야 합니다.
  // Groq는 현재(2025년 기준) 임베딩 모델을 직접 제공하지 않습니다.
  // RAG 구현을 위해서는 임베딩 서비스(예: OpenAI, Cohere)를 별도로 사용해야 함을 유의하세요.
  console.warn("Using placeholder for embedding. Replace with actual embedding service call.");
  return Array(1536).fill(0); // 임시 더미 벡터 반환
}

/**
 * RAG와 결합된 스트리밍 답변 생성
 * @param systemPrompt - 챗봇의 역할 정의
 * @param userQuestion - 사용자의 질문
 * @param context - RAG 검색 결과(지식 청크)
 * @returns 응답 스트림 (ReadableStream)
 */
export async function generateStreamingResponse(
  systemPrompt: string,
  userQuestion: string,
  context: string // RAG로 검색된 지식 청크 내용
): Promise<ReadableStream> {
  // 프롬프트 구성: RAG 컨텍스트를 LLM에 전달하는 핵심 부분
  const fullPrompt = `
    당신은 사용자 정의 지식 기반 챗봇입니다.
    다음 'CONTEXT'를 사용하여 질문에 답변하세요.
    만약 CONTEXT에 답변할 정보가 없다면, "관련 정보를 찾을 수 없습니다."라고 응답하세요.
    
    --- CONTEXT ---
    ${context}
    ---
    
    사용자의 질문: ${userQuestion}
  `;

  const stream = await groq.chat.completions.create({
    model: GENERATION_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: fullPrompt },
    ],
    temperature: 0.2, // 답변의 일관성을 위해 낮은 온도 설정
    stream: true, // 스트리밍 응답 활성화
  });
  
  // Groq SDK 스트림을 Node.js/Web API의 ReadableStream으로 변환하여 Next.js 라우터에 전달
  return stream as unknown as ReadableStream;
}