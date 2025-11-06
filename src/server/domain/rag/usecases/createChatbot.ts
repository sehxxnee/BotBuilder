import { RagRepository } from '../repository';

export async function createChatbotUsecase(
  repo: RagRepository,
  params: { name: string; systemPrompt: string; userId: string }
) {
  return repo.createChatbot(params.name, params.systemPrompt, params.userId);
}


