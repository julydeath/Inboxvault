import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { workspaceSummary } from "@/lib/summary";

export async function GET() {
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  try {
    return NextResponse.json(await workspaceSummary(userId), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Your workspace could not be loaded. Please try again." },
      { status: 503 },
    );
  }
}
