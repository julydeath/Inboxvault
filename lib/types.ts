export type FileItem = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  emailDate: string | null;
};

export type ScanJobSummary = {
  id: string;
  query: string;
  status: "queued" | "running" | "completed" | "failed";
  processed: number;
  found: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceSummary = {
  totalFiles: number;
  indexedBytes: number;
  latestJob: ScanJobSummary | null;
  connection: {
    provider: "gmail";
    email: string;
    name: string;
    connected: boolean;
  };
  scanEnabled: boolean;
};

export type WorkspaceView = "overview" | "files" | "scans" | "settings";
