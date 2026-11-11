import type { Metadata } from "next";
import { integrationReady } from "@/lib/config";
import { ConnectionPanel } from "@/components/connection-panel";

export const metadata: Metadata = { title: "Connect Gmail" };
export const dynamic = "force-dynamic";

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <ConnectionPanel
      ready={integrationReady()}
      error={
        error
          ? "Google sign-in did not finish. Please retry with an approved test account and allow read-only Gmail access."
          : undefined
      }
    />
  );
}
