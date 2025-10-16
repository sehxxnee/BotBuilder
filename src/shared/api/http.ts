import { NextResponse } from 'next/server';

export const ok = <T>(data: T, init?: number | ResponseInit) =>
  NextResponse.json(data, typeof init === 'number' ? { status: init } : init);

export const bad = (message = 'Bad Request', status = 400) =>
  NextResponse.json({ error: message }, { status });
