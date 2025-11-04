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
    return this.prisma.$queryRaw<{ content: string; similarity: number; id: string }[]>`
      SELECT 
        id,
        content,
        "embedding" <-> ${vectorString}::vector AS similarity
      FROM "KBChunk"
      WHERE "chatbotId" = ${chatbotId}
      ORDER BY similarity ASC
      LIMIT ${limit};
    `;
  }

  async findAllChatbots() {
    return this.prisma.chatbot.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        systemPrompt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            knowledgeChunks: true,
            queryLogs: true,
          },
        },
      },
    });
  }

  async findQueryLogsByChatbotId(chatbotId: string, limit = 50) {
    return this.prisma.queryLog.findMany({
      where: { chatbotId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        question: true,
        answer: true,
        retrievedChunkIds: true,
        createdAt: true,
      },
    });
  }

  async createQueryLog(params: {
    chatbotId: string;
    question: string;
    answer: string;
    retrievedChunkIds: string[];
  }) {
    return this.prisma.queryLog.create({
      data: {
        chatbotId: params.chatbotId,
        question: params.question,
        answer: params.answer,
        retrievedChunkIds: params.retrievedChunkIds,
      },
    });
  }
}


