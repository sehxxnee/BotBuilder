import { RagRepository } from '../repository';
import { generateStreamingResponse, createEmbedding } from '@/server/infrastructure/llm/groq';

export async function answerQuestionUsecase(repo: RagRepository, params: { chatbotId: string; question: string }) {
  const chatbot = await repo.findChatbotById(params.chatbotId);
  if (!chatbot) {
    throw new Error('Chatbot not found.');
  }

  const questionVector = await createEmbedding(params.question);
  if (!questionVector || questionVector.length === 0) {
    const defaultContext = '지식 기반을 로드할 수 없습니다. 관련 파일이 업로드되었는지 확인해주세요.';
    return generateStreamingResponse(chatbot.systemPrompt, params.question, defaultContext);
  }

  const chunks = await repo.queryRelevantChunks(params.chatbotId, questionVector, 5);
  const contextText = chunks.map((c) => c.content).join('\n\n--- 컨텍스트 청크 구분선 ---\n\n');

  return generateStreamingResponse(chatbot.systemPrompt, params.question, contextText);
}


