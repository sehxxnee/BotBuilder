import { Redis } from 'ioredis';
import { RagRepository } from '../repository';

export async function processFileUsecase(
  deps: { repo: RagRepository; redis: Redis },
  params: { chatbotId: string; fileKey: string; fileName: string }
) {
  const chatbot = await deps.repo.findChatbotById(params.chatbotId);
  if (!chatbot) {
    throw new Error('Chatbot not found.');
  }

  const QUEUE_NAME = 'embedding_queue';
  const jobData = {
    fileKey: params.fileKey,
    fileName: params.fileName,
    chatbotId: params.chatbotId,
    timestamp: new Date().toISOString(),
  };

  await deps.redis.lpush(QUEUE_NAME, JSON.stringify(jobData));

  return {
    success: true,
    message: `'${params.fileName}' 파일의 학습 작업이 큐에 추가되었습니다. 잠시 후 챗봇 ${chatbot.name}에 반영됩니다.`,
  };
}


