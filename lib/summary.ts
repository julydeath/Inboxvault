import { db } from "./db";
import type { ScanJobSummary, WorkspaceSummary } from "./types";

export const jobSelect = {
  id: true,
  query: true,
  status: true,
  processed: true,
  found: true,
  error: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function serializeJob(job: {
  id: string;
  query: string;
  status: string;
  processed: number;
  found: number;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ScanJobSummary {
  return {
    ...job,
    status: job.status as ScanJobSummary["status"],
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export async function workspaceSummary(
  userId: string,
): Promise<WorkspaceSummary> {
  const [stats, latest, connection, user] = await Promise.all([
    db.attachment.aggregate({
      where: { userId },
      _count: true,
      _sum: { size: true },
    }),
    db.scanJob.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: jobSelect,
    }),
    db.gmailConnection.findUnique({
      where: { userId },
      select: { userId: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
  ]);
  return {
    totalFiles: stats._count,
    indexedBytes: stats._sum.size || 0,
    latestJob: latest ? serializeJob(latest) : null,
    connection: {
      provider: "gmail",
      name: user?.name || "there",
      email: user?.email || "",
      connected: Boolean(connection),
    },
    scanEnabled: process.env.NODE_ENV !== "production",
  };
}
