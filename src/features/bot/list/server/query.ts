import { BotRepo } from '@entities/bot/lib/repo.server';
export const listBots = () => BotRepo.findMany();
