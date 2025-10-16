import { randomUUID } from 'crypto';
import { CreateBotInput } from '../model/schema';
import { BotRepo } from '@entities/bot/lib/repo.server';

export async function createBot(raw: unknown) {
  const { name, description } = CreateBotInput.parse(raw);
  return BotRepo.create({
    id: randomUUID(),
    publicKey: randomUUID(),
    name,
    description: description ?? null,
  });
}
