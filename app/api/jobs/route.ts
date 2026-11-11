import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { jobSelect, serializeJob } from "@/lib/summary";

const input = z.object({
  query: z.string().trim().max(400).default("has:attachment"),
});
export async function GET() {
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  try {
    const jobs = await db.scanJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: jobSelect,
    });
    return NextResponse.json(jobs.map(serializeJob), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Scan history could not be loaded. Please try again." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  if (process.env.NODE_ENV === "production")
    return NextResponse.json(
      { error: "Scanning is available in the local private preview only." },
      { status: 501 },
    );
  const parsed = input.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Use a Gmail query of 400 characters or fewer." },
      { status: 400 },
    );
  try {
    const result = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      const connection = await tx.gmailConnection.findUnique({
        where: { userId },
        select: { userId: true },
      });
      if (!connection) return { kind: "disconnected" as const };
      const active = await tx.scanJob.findFirst({
        where: { userId, status: { in: ["queued", "running"] } },
      });
      if (active) return { kind: "active" as const };
      const job = await tx.scanJob.create({
        data: { userId, query: parsed.data.query || "has:attachment" },
        select: jobSelect,
      });
      return { kind: "created" as const, job };
    });
    if (result.kind === "active")
      return NextResponse.json(
        { error: "Continue your existing scan before starting another." },
        { status: 409 },
      );
    if (result.kind === "disconnected")
      return NextResponse.json(
        { error: "Connect Gmail before creating a scan." },
        { status: 409 },
      );
    return NextResponse.json(serializeJob(result.job), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Your scan could not be created. Please try again." },
      { status: 503 },
    );
  }
}
