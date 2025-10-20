import { BotRepo } from '@entities/bot/lib/repo.server';
export const listBots = () => BotRepo.findMany();
export const getBotById = (id: string) => BotRepo.findById(id);
