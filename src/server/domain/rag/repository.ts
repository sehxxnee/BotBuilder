import { PrismaClient } from '@prisma/client';

export class RagRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createChatbot(name: string, systemPrompt: string) {
    return this.prisma.chatbot.create({
      data: { name, systemPrompt },
    });
  }

  async findChatbotById(chatbotId: string) {
    return this.prisma.chatbot.findUnique({ where: { id: chatbotId } });
  }

  async queryRelevantChunks(chatbotId: string, vector: number[], limit = 5) {
    const vectorString = `[${vector.join(',')}]`;
    return this.prisma.$queryRaw<{ content: string; similarity: number }[]>`
      SELECT 
        content,
        "embedding" <-> ${vectorString}::vector AS similarity
      FROM "KBChunk"
      WHERE "chatbotId" = ${chatbotId}
      ORDER BY similarity ASC
      LIMIT ${limit};
    `;
  }
}


