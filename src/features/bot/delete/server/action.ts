import { prisma } from '@shared/lib/db';
import { ChunkRepo } from '@entities/chunk/lib/repo.server';
import { DatasourceRepo } from '@entities/datasource/lib/repo.server';
import { BotRepo } from '@entities/bot/lib/repo.server';

export async function deleteBot(id: string) {
  const bot = await prisma.bot.findUnique({ where: { id } });
  if (!bot) throw new Error('bot not found');
  await prisma.$transaction([
    prisma.documentChunk.deleteMany({ where: { botId: id } }),
    prisma.datasource.deleteMany({ where: { botId: id } }),
    prisma.bot.delete({ where: { id } }),
  ]);
  return { id };
}


