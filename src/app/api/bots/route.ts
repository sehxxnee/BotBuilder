import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  const bots = await prisma.bot.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(bots);
}

export async function POST(req: Request) {
  const { name, description } = await req.json().catch(() => ({}));
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const bot = await prisma.bot.create({
    data: { id: randomUUID(), publicKey: randomUUID(), name, description: description ?? null },
  });
  return NextResponse.json(bot, { status: 201 });
}
