import type { WorkspaceView } from "@/lib/types";
import type { IconName } from "./icon";

export const navigation: {
  view: WorkspaceView;
  href: string;
  label: string;
  icon: IconName;
}[] = [
  { view: "overview", href: "", label: "Overview", icon: "grid" },
  { view: "files", href: "/files", label: "Attachments", icon: "folder" },
  { view: "scans", href: "/scans", label: "Scan history", icon: "clock" },
  { view: "settings", href: "/settings", label: "Settings", icon: "settings" },
];
