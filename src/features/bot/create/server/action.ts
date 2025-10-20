import { randomUUID } from 'crypto';
import { CreateBotInput } from '../model/schema';
import { BotRepo } from '@entities/bot/lib/repo.server';

export async function createBot(raw: unknown) {
  const { name, description, persona, greeting, prompt, language, tone } = CreateBotInput.parse(raw);
  const settings = {
    persona: persona ?? '',
    greeting: greeting ?? '',
    prompt: prompt ?? '',
  };
  return BotRepo.create({
    id: randomUUID(),
    publicKey: randomUUID(),
    name,
    description: description ?? null,
    language: language ?? undefined,
    tone: tone ?? undefined,
    settingsJson: JSON.stringify(settings),
  });
}
