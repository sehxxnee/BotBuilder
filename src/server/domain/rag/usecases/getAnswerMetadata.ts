import { TRPCError } from '@trpc/server';
import { RagRepository } from '../repository';
import { createEmbedding } from '@/server/infrastructure/llm/groq';

export interface GetAnswerMetadataParams {
  chatbotId: string;
  question: string;
}

export interface GetAnswerMetadataResult {
  retrievedChunkIds: string[];
}

export async function getAnswerMetadataUsecase(
  repo: RagRepository,
  params: GetAnswerMetadataParams
): Promise<GetAnswerMetadataResult> {
  try {
    const chatbot = await repo.findChatbotById(params.chatbotId);
    if (!chatbot) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Chatbot not found.' });
    }

    const questionVector = await createEmbedding(params.question);
    
    if (!questionVector || questionVector.length === 0) {
      return { retrievedChunkIds: [] };
    }

    const chunks = await repo.queryRelevantChunks(params.chatbotId, questionVector, 5);
    return { retrievedChunkIds: chunks.map((c) => c.id) };
  } catch (e) {
    if (e instanceof TRPCError) throw e;
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get answer metadata.' });
  }
}
