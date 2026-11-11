import { notFound } from "next/navigation";
import Dashboard from "@/components/dashboard";
import { demoSummary } from "@/lib/demo";
import type { WorkspaceView } from "@/lib/types";

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
  return <Dashboard initialSummary={demoSummary} view={view} demo />;
}
