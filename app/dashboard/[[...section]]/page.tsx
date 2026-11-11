import { notFound } from "next/navigation";
import { WorkspacePage } from "@/components/workspace-page";
import type { WorkspaceView } from "@/lib/types";

export const dynamic = "force-dynamic";
const views: Record<string, WorkspaceView> = {
  "": "overview",
  files: "files",
  scans: "scans",
  settings: "settings",
};
export default async function Page({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = await params;
  const view = views[(section || []).join("/")];
  if (!view) notFound();
  return <WorkspacePage view={view} />;
}
