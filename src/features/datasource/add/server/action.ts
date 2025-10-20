import { AddDatasourceInput, AddDatasourceFileInput } from '../model/schema';
import { DatasourceRepo } from '@entities/datasource/lib/repo.server';
import { prisma } from '@shared/lib/db';
import { ChunkRepo } from '@entities/chunk/lib/repo.server';
import { embedTexts } from '@features/chat/rag/server/openai';

export async function addDatasource(botId: string, raw: unknown) {
  const { url } = AddDatasourceInput.parse(raw);
  const bot = await prisma.bot.findUnique({ where: { id: botId } });
  if (!bot) throw new Error('bot not found');
  const ds = await DatasourceRepo.add(botId, url);
  const [emb] = await embedTexts([url]);
  await ChunkRepo.createMany([
    { botId, datasourceId: ds.id, content: url, embedding: emb },
  ]);
  return { datasourceId: ds.id };
}

export async function addDatasourceFile(botId: string, raw: unknown) {
  const { filename } = AddDatasourceFileInput.parse(raw);
  const bot = await prisma.bot.findUnique({ where: { id: botId } });
  if (!bot) throw new Error('bot not found');
  const ds = await DatasourceRepo.addFile(botId, filename);
  const [emb] = await embedTexts([filename]);
  await ChunkRepo.createMany([
    { botId, datasourceId: ds.id, content: filename, embedding: emb },
  ]);
  return { datasourceId: ds.id };
}

// chunking and text extraction TODO: replace url/filename placeholders with file content parsing
