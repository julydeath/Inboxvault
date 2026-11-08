import { NextResponse } from 'next/server';
import { currentUserId } from '@/lib/session';
import { db } from '@/lib/db';
import { gmailClient, attachments } from '@/lib/gmail';
// Development-only: explicitly triggered short batches. A production build needs a durable worker/lease.
export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Production worker not configured' }, { status: 501 });
  const { id } = await context.params;
  const job = await db.scanJob.findFirst({ where: { id, userId } });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (job.status === 'completed') return NextResponse.json(job);
  try {
    const gmail = await gmailClient(userId);
    const page = await gmail.users.messages.list({ userId: 'me', q: job.query, maxResults: 100, pageToken: job.pageToken || undefined });
    const list = page.data.messages || [];
    const batch = list.slice(job.offset, job.offset + 10);
    let found = 0;
    for (const item of batch) {
      if (!item.id) continue;
      const message = await gmail.users.messages.get({ userId: 'me', id: item.id, format: 'full' });
      const date = message.data.internalDate ? new Date(Number(message.data.internalDate)) : null;
      for (const part of attachments(message.data.payload)) {
        await db.attachment.upsert({
          where: { userId_gmailMessageId_partId: { userId, gmailMessageId: item.id, partId: part.partId || '' } },
          create: { userId, gmailMessageId: item.id, gmailAttachmentId: part.body?.attachmentId || null, partId: part.partId || '', filename: part.filename!, mimeType: part.mimeType || 'application/octet-stream', size: part.body?.size || 0, emailDate: date },
          update: { filename: part.filename!, mimeType: part.mimeType || 'application/octet-stream', size: part.body?.size || 0 }
        });
        found++;
      }
    }
    const finishedPage = job.offset + batch.length >= list.length;
    const morePages = Boolean(page.data.nextPageToken);
    const status = finishedPage && !morePages ? 'completed' : 'running';
    const updated = await db.scanJob.update({ where: { id }, data: {
      status, processed: { increment: batch.length }, found: { increment: found },
      pageToken: finishedPage ? (page.data.nextPageToken || null) : job.pageToken,
      offset: finishedPage ? 0 : job.offset + batch.length, error: null
    } });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Gmail error';
    await db.scanJob.update({ where: { id }, data: { status: 'failed', error: message.slice(0, 500) } });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
