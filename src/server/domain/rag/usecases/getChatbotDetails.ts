import { RagRepository } from '../repository';
import { TRPCError } from '@trpc/server';

export async function getChatbotDetailsUsecase(repo: RagRepository, chatbotId: string) {
  const chatbot = await repo.findChatbotById(chatbotId);
  
  if (!chatbot) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Chatbot not found.' });
  }

  return chatbot;
}

