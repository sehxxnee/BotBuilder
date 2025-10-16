import { prisma } from '@shared/lib/db';

export const BotRepo = {
  findMany() {
    return prisma.bot.findMany({ orderBy: { createdAt: 'desc' } });
  },
  findByPublicKey(publicKey: string) {
    return prisma.bot.findFirst({ where: { publicKey } });
  },
  create(data: { id: string; publicKey: string; name: string; description?: string | null }) {
    return prisma.bot.create({ data });
  },
};
