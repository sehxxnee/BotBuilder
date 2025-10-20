import { prisma } from '@shared/lib/db';

export type NewChatMessage = { botId: string; role: 'user' | 'assistant'; content: string };

export const ChatMessageRepo = {
  listByBot(botId: string, limit = 100) {
    return prisma.chatMessage.findMany({ where: { botId }, orderBy: { createdAt: 'asc' }, take: limit });
  },
  createMany(items: NewChatMessage[]) {
    return prisma.$transaction(items.map(i => prisma.chatMessage.create({ data: i })));
  },
  create(item: NewChatMessage) {
    return prisma.chatMessage.create({ data: item });
  },
};


