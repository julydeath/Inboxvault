import { NextResponse } from 'next/server';
import { currentUserId } from '@/lib/session';
import { db } from '@/lib/db';
export async function GET(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const search = (url.searchParams.get('search') || '').slice(0, 150);
  const mime = (url.searchParams.get('mime') || '').slice(0, 100);
  const cursor = url.searchParams.get('cursor') || undefined;
  const items = await db.attachment.findMany({ where: { userId, ...(search ? { filename: { contains: search, mode: 'insensitive' } } : {}), ...(mime ? { mimeType: { startsWith: mime } } : {}) }, take: 51, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}), orderBy: { id: 'asc' } });
  return NextResponse.json({ files: items.slice(0, 50), nextCursor: items.length > 50 ? items[49].id : null });
}
