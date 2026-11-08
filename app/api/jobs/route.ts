import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUserId } from '@/lib/session';
import { db } from '@/lib/db';
const input = z.object({ query: z.string().max(400).default('has:attachment') });
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await db.scanJob.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 }));
}
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  const active = await db.scanJob.findFirst({ where: { userId, status: { in: ['queued', 'running'] } } });
  if (active) return NextResponse.json({ error: 'Finish your existing scan first' }, { status: 409 });
  const job = await db.scanJob.create({ data: { userId, query: parsed.data.query || 'has:attachment' } });
  return NextResponse.json(job, { status: 201 });
}
