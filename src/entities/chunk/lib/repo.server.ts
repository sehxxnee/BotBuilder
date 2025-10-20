import { prisma } from '@shared/lib/db';

export type NewChunk = {
  botId: string;
  datasourceId?: string | null;
  content: string;
  embedding: number[];
};

export const ChunkRepo = {
  async createMany(items: NewChunk[]) {
    if (items.length === 0) return [] as const;
    const created = await prisma.$transaction(
      items.map((i) =>
        prisma.documentChunk.create({
          data: {
            botId: i.botId,
            datasourceId: i.datasourceId ?? null,
            content: i.content,
            embedding: i.embedding as unknown as any,
          },
        })
      )
    );
    return created;
  },
  listByBot(botId: string) {
    return prisma.documentChunk.findMany({ where: { botId }, orderBy: { createdAt: 'desc' } });
  },
  deleteByBot(botId: string) {
    return prisma.documentChunk.deleteMany({ where: { botId } });
  },
};


