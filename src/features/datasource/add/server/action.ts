import { AddDatasourceInput, AddDatasourceFileInput } from '../model/schema';
import { DatasourceRepo } from '@entities/datasource/lib/repo.server';
import { prisma } from '@shared/lib/db';

export async function addDatasource(botId: string, raw: unknown) {
  const { url } = AddDatasourceInput.parse(raw);
  const bot = await prisma.bot.findUnique({ where: { id: botId } });
  if (!bot) throw new Error('bot not found');
  const ds = await DatasourceRepo.add(botId, url);
  return { datasourceId: ds.id };
}

export async function addDatasourceFile(botId: string, raw: unknown) {
  const { filename } = AddDatasourceFileInput.parse(raw);
  const bot = await prisma.bot.findUnique({ where: { id: botId } });
  if (!bot) throw new Error('bot not found');
  const ds = await DatasourceRepo.addFile(botId, filename);
  return { datasourceId: ds.id };
}
