import { prisma } from '@shared/lib/db';
import { env } from '@shared/config/env';
import { ChunkRepo } from '@entities/chunk/lib/repo.server';
import { embedTexts, chatWithContext } from './openai';

type StoredChunk = {
  id: string;
  botId: string;
  datasourceId: string | null;
  content: string;
  embedding: unknown; // prisma Json to be parsed
};

type RAGOptions = { maxContext?: number };

export async function generateRagReply(botId: string, userMessage: string, options: RAGOptions = {}) {
  const maxContext = options.maxContext ?? 3;
  // 1) load bot
  const bot = await prisma.bot.findUnique({ where: { id: botId } });
  if (!bot) throw new Error('bot not found');
  // 2) retrieve top-k chunks by cosine similarity over stored embeddings
  const [queryEmbedding] = env.OPENAI_API_KEY ? await embedTexts([userMessage]) : [embedQueryStub(userMessage)];
  const all = (await ChunkRepo.listByBot(botId)) as unknown as StoredChunk[];
  const scored = all
    .map((c) => {
      const vector: number[] = Array.isArray(c.embedding)
        ? (c.embedding as number[])
        : (c.embedding as unknown as number[]);
      return { c, score: cosine(vector, queryEmbedding) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxContext);
  const context = scored.map((s) => s.c.content).join('\n');

  // 3) construct prompt using bot settingsJson (persona, greeting, prompt)
  let settings: { persona?: string; greeting?: string; prompt?: string } = {};
  try { settings = JSON.parse(bot.settingsJson || '{}'); } catch {}
  const systemPrompt = [
    settings.persona ? `Persona: ${settings.persona}` : '',
    settings.greeting ? `Greeting: ${settings.greeting}` : '',
    settings.prompt ? `Instructions: ${settings.prompt}` : '',
  ].filter(Boolean).join('\n');

  // 4) call LLM — placeholder if no OPENAI_API_KEY
  let reply: string;
  if (!env.OPENAI_API_KEY) {
    reply = [
      systemPrompt && `【System】\n${systemPrompt}`,
      context && `【Context】\n${context}`,
      `【Answer】\n${userMessage}`,
    ].filter(Boolean).join('\n\n');
  } else {
    const system = systemPrompt || 'You are a helpful RAG assistant. Use the provided context.';
    const user = `Context:\n${context}\n\nQuestion: ${userMessage}`;
    reply = await chatWithContext(system, user);
  }

  return { reply };
}

function embedQueryStub(text: string): number[] {
  const dims = 8; const v = new Array(dims).fill(0);
  for (let i = 0; i < text.length; i++) v[i % dims] += text.charCodeAt(i);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map(x => x / norm);
}

function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}


