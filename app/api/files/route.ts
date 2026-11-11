import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  const url = new URL(request.url);
  const search = (url.searchParams.get("search") || "").trim().slice(0, 150);
  const mime = (url.searchParams.get("mime") || "").slice(0, 100);
  const cursor = url.searchParams.get("cursor") || undefined;
  try {
    if (
      cursor &&
      !(await db.attachment.findFirst({
        where: { id: cursor, userId },
        select: { id: true },
      }))
    )
      return NextResponse.json(
        { error: "This page is no longer available. Refresh the file list." },
        { status: 400 },
      );
    const items = await db.attachment.findMany({
      where: {
        userId,
        ...(search
          ? { filename: { contains: search, mode: "insensitive" as const } }
          : {}),
        ...(mime ? { mimeType: { startsWith: mime } } : {}),
      },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        emailDate: true,
      },
      take: 51,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });
    return NextResponse.json(
      {
        files: items.slice(0, 50),
        nextCursor: items.length > 50 ? items[49].id : null,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Your attachments could not be loaded. Please try again." },
      { status: 503 },
    );
  }
}
