import { prisma } from '@shared/lib/db';

export const DatasourceRepo = {
  listByBot(botId: string) {
    return prisma.datasource.findMany({ where: { botId }, orderBy: { createdAt: 'desc' } });
  },
  add(botId: string, url: string) {
    return prisma.datasource.create({ data: { botId, url } });
  },
};
