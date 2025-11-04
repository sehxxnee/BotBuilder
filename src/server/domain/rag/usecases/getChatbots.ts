import { RagRepository } from '../repository';

export async function getChatbotsUsecase(repo: RagRepository) {
  return repo.findAllChatbots();
}

