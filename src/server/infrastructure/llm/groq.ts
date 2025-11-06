import Groq from 'groq-sdk';
import { ReadableStream } from 'stream/web';
import { env } from '@/server/config/env';

if (!env.GROQ_API_KEY) {
  console.warn('GROQ_API_KEY가 설정되지 않았습니다. Groq API를 사용할 수 없습니다.');
}

const groq = new Groq({ 
  apiKey: env.GROQ_API_KEY || 'dummy-key',
});

const MOCK_VECTOR_DIMENSION = 768;

export async function createEmbedding(text: string): Promise<number[]> {
  if (!text || text.length === 0) return [];
  return Array.from({ length: MOCK_VECTOR_DIMENSION }, () => Math.random());
}

const GENERATION_MODEL = env.GROQ_MODEL || 'llama-3.1-8b-instant';

export async function generateStreamingResponse(
  systemPrompt: string,
  question: string,
  context?: string
): Promise<ReadableStream> {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY가 설정되지 않았습니다. .env 파일에 GROQ_API_KEY를 추가해주세요.');
  }

  try {
    const finalSystemPrompt = context
      ? `${systemPrompt}\n\n다음은 사용자 질문에 답변하기 위한 참고 정보입니다:\n\n${context}\n\n위의 정보를 바탕으로 정확하고 도움이 되는 답변을 제공해주세요.`
      : systemPrompt;

    console.log(`[Groq] 스트리밍 응답 생성 시작... (model: ${GENERATION_MODEL})`);
    const stream = await groq.chat.completions.create({
      model: GENERATION_MODEL,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.2,
      stream: true,
    });
    console.log('[Groq] 스트리밍 응답 생성 완료');

    const encoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    }) as ReadableStream;
  } catch (error) {
    console.error('Groq API 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    throw new Error(`Groq API 응답을 생성할 수 없습니다: ${errorMessage}`);
  }
}


