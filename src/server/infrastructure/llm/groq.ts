import Groq from 'groq-sdk';
import { ReadableStream } from 'stream/web';
import { env } from '@/server/config/env';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

const MOCK_VECTOR_DIMENSION = 768;

export async function createEmbedding(text: string): Promise<number[]> {
  if (!text || text.length === 0) return [];
  return Array.from({ length: MOCK_VECTOR_DIMENSION }, () => Math.random());
}

const GENERATION_MODEL = 'mixtral-8x7b-32768';

export async function generateStreamingResponse(
  systemPrompt: string,
  question: string,
  context?: string
): Promise<ReadableStream> {
  try {
    const finalSystemPrompt = context
      ? `${systemPrompt}\n\n다음은 사용자 질문에 답변하기 위한 참고 정보입니다:\n\n${context}\n\n위의 정보를 바탕으로 정확하고 도움이 되는 답변을 제공해주세요.`
      : systemPrompt;

    const stream = await groq.chat.completions.create({
      model: GENERATION_MODEL,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.2,
      stream: true,
    });

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
  } catch {
    throw new Error('Groq API 응답을 생성할 수 없습니다. (API 키, 네트워크 확인)');
  }
}


