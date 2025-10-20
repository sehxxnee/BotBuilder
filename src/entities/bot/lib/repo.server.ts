import { prisma } from '@shared/lib/db';

export const BotRepo = {
  findMany() {
    return prisma.bot.findMany({ orderBy: { createdAt: 'desc' } });
  },
  findByPublicKey(publicKey: string) {
    return prisma.bot.findFirst({ where: { publicKey } });
  },
  findById(id: string) {
    return prisma.bot.findUnique({ where: { id } });
  },
  create(data: {
    id: string;
    publicKey: string;
    name: string;
    description?: string | null;
    language?: string;
    tone?: string;
    settingsJson?: string;
  }) {
    return prisma.bot.create({ data });
  },
};
