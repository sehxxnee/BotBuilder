// src/server/domain/rag/usecases/saveAnswer.ts

import { TRPCError } from '@trpc/server';
import { RagRepository } from '../repository';

export interface SaveAnswerParams {
  chatbotId: string;
  question: string;
  answer: string;
  retrievedChunkIds: string[];
}

export interface SaveAnswerResult {
  id: string;
  chatbotId: string;
  question: string;
  answer: string;
  retrievedChunkIds: string[];
  createdAt: Date;
}

export async function saveAnswerUsecase(
  repo: RagRepository,
  params: SaveAnswerParams
): Promise<SaveAnswerResult> {
  try {
    return await repo.createQueryLog({
      chatbotId: params.chatbotId,
      question: params.question,
      answer: params.answer,
      retrievedChunkIds: params.retrievedChunkIds,
    });
  } catch (e) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save query log.' });
  }
}
