import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const bots = await prisma.bot.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(bots);
}
