import { RagRepository } from '../repository';
import { TRPCError } from '@trpc/server';

export async function getChatHistoryUsecase(repo: RagRepository, chatbotId: string, limit?: number) {
  // 챗봇 존재 여부 확인
  const chatbot = await repo.findChatbotById(chatbotId);
  if (!chatbot) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Chatbot not found.' });
  }

  return repo.findQueryLogsByChatbotId(chatbotId, limit);
}

