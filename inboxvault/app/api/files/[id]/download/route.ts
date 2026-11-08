import { NextResponse } from 'next/server';
import { currentUserId } from '@/lib/session';
import { db } from '@/lib/db';
import { gmailClient, decodeBase64Url } from '@/lib/gmail';
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  const file = await db.attachment.findFirst({ where: { id, userId } });
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (file.size > 15_000_000) return NextResponse.json({ error: 'File too large for direct download; use a future streamed exporter.' }, { status: 413 });
  try {
    const gmail = await gmailClient(userId);
    let encoded: string | null | undefined;
    if (file.gmailAttachmentId) {
      const response = await gmail.users.messages.attachments.get({ userId: 'me', messageId: file.gmailMessageId, id: file.gmailAttachmentId });
      encoded = response.data.data;
    } else {
      const response = await gmail.users.messages.get({ userId: 'me', id: file.gmailMessageId, format: 'full' });
      const findPart = (p: any): any => p?.partId === file.partId ? p : p?.parts?.map(findPart).find(Boolean);
      encoded = findPart(response.data.payload)?.body?.data;
    }
    if (!encoded) return NextResponse.json({ error: 'File content unavailable' }, { status: 404 });
    const bytes = decodeBase64Url(encoded);
    const safeName = file.filename.replace(/[\r\n"\\]/g, '_');
    return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${safeName.replace(/[^\x20-\x7e]/g, '_')}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return NextResponse.json({ error: 'Unable to fetch attachment' }, { status: 502 }); }
}
