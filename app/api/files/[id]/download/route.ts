import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { gmailClient, decodeBase64Url, type GmailPart } from "@/lib/gmail";
import { DIRECT_DOWNLOAD_LIMIT } from "@/lib/format";
import { attachmentDisposition } from "@/lib/file-headers";

function findPart(
  part: GmailPart | null | undefined,
  partId: string | null,
): GmailPart | undefined {
  if (part?.partId === partId) return part;
  for (const child of part?.parts || []) {
    const found = findPart(child, partId);
    if (found) return found;
  }
}

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  const { id } = await context.params;
  try {
    const file = await db.attachment.findFirst({ where: { id, userId } });
    if (!file)
      return NextResponse.json(
        { error: "Attachment not found in your library." },
        { status: 404 },
      );
    if (file.size > DIRECT_DOWNLOAD_LIMIT)
      return NextResponse.json(
        {
          error:
            "Direct downloads support files up to 15 MB. Large-file delivery is planned for later.",
        },
        { status: 413 },
      );
    const gmail = await gmailClient(userId);
    let encoded: string | null | undefined;
    if (file.gmailAttachmentId) {
      const response = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId: file.gmailMessageId,
        id: file.gmailAttachmentId,
      });
      encoded = response.data.data;
    } else {
      const response = await gmail.users.messages.get({
        userId: "me",
        id: file.gmailMessageId,
        format: "full",
      });
      encoded = findPart(response.data.payload, file.partId)?.body?.data;
    }
    if (encoded == null)
      return NextResponse.json(
        { error: "This attachment is no longer available in Gmail." },
        { status: 404 },
      );
    const bytes = decodeBase64Url(encoded);
    if (bytes.length > DIRECT_DOWNLOAD_LIMIT)
      return NextResponse.json(
        { error: "This attachment exceeds the 15 MB direct-download limit." },
        { status: 413 },
      );
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": attachmentDisposition(file.filename),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    const message =
      code === 401 || code === 403
        ? "Gmail access has expired. Reconnect your Google account and retry the download."
        : code === 404
          ? "This attachment is no longer available in Gmail."
          : "The attachment could not be downloaded. Check your Gmail connection and try again.";
    return NextResponse.json(
      { error: message },
      { status: code === 404 ? 404 : 502 },
    );
  }
}
