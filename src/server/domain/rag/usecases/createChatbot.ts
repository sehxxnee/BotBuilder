import { RagRepository } from '../repository';

export async function createChatbotUsecase(repo: RagRepository, params: { name: string; systemPrompt: string }) {
  return repo.createChatbot(params.name, params.systemPrompt);
}


