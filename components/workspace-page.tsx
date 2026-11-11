import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { integrationReady } from "@/lib/config";
import { workspaceSummary } from "@/lib/summary";
import type { WorkspaceView } from "@/lib/types";
import Dashboard from "./dashboard";
import { ConnectionPanel } from "./connection-panel";

export async function WorkspacePage({ view }: { view: WorkspaceView }) {
  if (!integrationReady()) return <ConnectionPanel ready={false} />;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/connect");
  try {
    const summary = await workspaceSummary(userId);
    return <Dashboard initialSummary={summary} view={view} />;
  } catch {
    return (
      <ConnectionPanel
        ready
        workspaceError
        error="We couldn’t reach your workspace. Your files remain in Gmail. Please check the connection and try again."
      />
    );
  }
}
