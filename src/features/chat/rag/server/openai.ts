import OpenAI from 'openai';
import { env } from '@shared/config/env';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  return res.data.map((d) => d.embedding as unknown as number[]);
}

export async function chatWithContext(system: string, user: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.2,
  });
  return res.choices[0]?.message?.content ?? '';
}


