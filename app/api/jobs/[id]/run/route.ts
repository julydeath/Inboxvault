import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { gmailClient, attachments } from "@/lib/gmail";
import { processBatch } from "@/lib/scan-batch";
import { jobSelect, serializeJob } from "@/lib/summary";

class LeaseLost extends Error {}

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  const ownerId = userId;
  if (process.env.NODE_ENV === "production")
    return NextResponse.json(
      {
        error:
          "Scanning is available in the local private preview. A production worker is not configured.",
      },
      { status: 501 },
    );
  const { id } = await context.params;
  const leaseToken = randomUUID();
  const now = new Date();
  // A short database lease also protects a scan from another browser tab.
  const claimed = await db
    .$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      const job = await tx.scanJob.findFirst({ where: { id, userId } });
      if (!job) return { kind: "missing" as const };
      if (job.status === "completed")
        return { kind: "completed" as const, job };
      const other = await tx.scanJob.findFirst({
        where: {
          userId,
          id: { not: id },
          status: { in: ["queued", "running"] },
        },
      });
      if (
        other ||
        (job.leaseToken && job.leaseExpiresAt && job.leaseExpiresAt > now)
      )
        return { kind: "busy" as const };
      const updated = await tx.scanJob.update({
        where: { id },
        data: {
          status: "running",
          error: null,
          leaseToken,
          leaseExpiresAt: new Date(now.getTime() + 120_000),
        },
      });
      return { kind: "claimed" as const, job: updated };
    })
    .catch(() => null);
  if (!claimed)
    return NextResponse.json(
      { error: "The scan could not be loaded. Please try again." },
      { status: 503 },
    );
  if (claimed.kind === "missing")
    return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  if (claimed.kind === "busy")
    return NextResponse.json(
      {
        error:
          "A batch is already processing. Wait a moment, then refresh your workspace.",
      },
      { status: 409 },
    );
  if (claimed.kind === "completed")
    return NextResponse.json(serializeJob(claimed.job));
  const job = claimed.job;

  async function checkpoint(
    data: Parameters<typeof db.scanJob.updateMany>[0]["data"],
  ) {
    const result = await db.scanJob.updateMany({
      where: { id, userId: ownerId, leaseToken },
      data,
    });
    if (result.count !== 1)
      throw new LeaseLost(
        "Another batch has taken over. Refresh your workspace.",
      );
  }

  try {
    const gmail = await gmailClient(userId);
    await processBatch(
      job,
      {
        async page(token) {
          const response = await gmail.users.messages.list({
            userId: "me",
            q: job.query,
            maxResults: 100,
            pageToken: token || undefined,
          });
          return {
            ids: (response.data.messages || []).flatMap((message) =>
              message.id ? [message.id] : [],
            ),
            nextPageToken: response.data.nextPageToken || null,
          };
        },
        async message(messageId) {
          try {
            const response = await gmail.users.messages.get({
              userId: "me",
              id: messageId,
              format: "full",
            });
            return {
              date: response.data.internalDate
                ? new Date(Number(response.data.internalDate))
                : null,
              parts: attachments(response.data.payload).map((part) => ({
                partId: part.partId || "",
                filename: part.filename!,
                mimeType: part.mimeType || "application/octet-stream",
                size: part.body?.size || 0,
                attachmentId: part.body?.attachmentId || null,
              })),
            };
          } catch (error) {
            // A message removed since the snapshot is safely skipped.
            if ((error as { code?: number }).code === 404)
              return { date: null, parts: [] };
            throw error;
          }
        },
      },
      {
        async savePage(messageIds, nextPageToken) {
          await checkpoint({ messageIds, nextPageToken });
        },
        async commitMessage(messageId, data, nextOffset) {
          await db.$transaction(async (tx) => {
            // Renewing the lease and inserting metadata share one transaction.
            // A worker with a stale lease cannot commit partial work.
            const owned = await tx.scanJob.updateMany({
              where: { id, userId, leaseToken },
              data: {
                offset: nextOffset,
                processed: { increment: 1 },
                found: { increment: data.parts.length },
                leaseExpiresAt: new Date(Date.now() + 120_000),
              },
            });
            if (owned.count !== 1)
              throw new LeaseLost(
                "Another batch has taken over. Refresh your workspace.",
              );
            for (const part of data.parts) {
              const metadata = {
                filename: part.filename,
                mimeType: part.mimeType,
                size: part.size,
                gmailAttachmentId: part.attachmentId,
                emailDate: data.date,
              };
              await tx.attachment.upsert({
                where: {
                  userId_gmailMessageId_partId: {
                    userId,
                    gmailMessageId: messageId,
                    partId: part.partId,
                  },
                },
                create: {
                  ...metadata,
                  userId,
                  gmailMessageId: messageId,
                  partId: part.partId,
                },
                update: metadata,
              });
            }
          });
        },
        async finishPage(nextPageToken) {
          await checkpoint({
            status: nextPageToken ? "running" : "completed",
            pageToken: nextPageToken,
            nextPageToken: null,
            messageIds: [],
            offset: 0,
            leaseToken: null,
            leaseExpiresAt: null,
            error: null,
          });
        },
        async continuePage() {
          await checkpoint({
            status: "running",
            leaseToken: null,
            leaseExpiresAt: null,
            error: null,
          });
        },
      },
    );
    const updated = await db.scanJob.findFirstOrThrow({
      where: { id, userId },
      select: jobSelect,
    });
    return NextResponse.json(serializeJob(updated));
  } catch (error) {
    if (error instanceof LeaseLost)
      return NextResponse.json({ error: error.message }, { status: 409 });
    const code = (error as { code?: number }).code;
    const message =
      code === 401 || code === 403
        ? "Gmail access has expired or is unavailable. Reconnect your Google account, then retry."
        : code === 429
          ? "Gmail is receiving too many requests. Wait a moment, then retry this batch."
          : "Gmail could not finish this batch. Your progress is saved. Reconnect if needed, then retry.";
    await db.scanJob
      .updateMany({
        where: { id, userId, leaseToken },
        data: {
          status: "failed",
          error: message,
          leaseToken: null,
          leaseExpiresAt: null,
        },
      })
      .catch(() => {});
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
