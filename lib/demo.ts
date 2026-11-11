import type { FileItem, ScanJobSummary, WorkspaceSummary } from "./types";

// Fictional examples only. This module never imports authentication or a database.
export const demoFiles: FileItem[] = [
  {
    id: "sample-01",
    filename: "Brand guidelines.pdf",
    mimeType: "application/pdf",
    size: 2450000,
    emailDate: "2026-11-08T10:00:00Z",
  },
  {
    id: "sample-02",
    filename: "Project proposal.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 186000,
    emailDate: "2026-11-07T10:00:00Z",
  },
  {
    id: "sample-03",
    filename: "Autumn collection.jpg",
    mimeType: "image/jpeg",
    size: 3200000,
    emailDate: "2026-11-06T10:00:00Z",
  },
  {
    id: "sample-04",
    filename: "Invoice — November.pdf",
    mimeType: "application/pdf",
    size: 94000,
    emailDate: "2026-11-05T10:00:00Z",
  },
  {
    id: "sample-05",
    filename: "Website assets.zip",
    mimeType: "application/zip",
    size: 8400000,
    emailDate: "2026-11-04T10:00:00Z",
  },
  {
    id: "sample-06",
    filename: "Launch walkthrough.mp4",
    mimeType: "video/mp4",
    size: 21400000,
    emailDate: "2026-11-03T10:00:00Z",
  },
  {
    id: "sample-07",
    filename: "Meeting notes.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 42000,
    emailDate: "2026-11-02T10:00:00Z",
  },
  {
    id: "sample-08",
    filename: "Voice memo.mp3",
    mimeType: "audio/mpeg",
    size: 1800000,
    emailDate: "2026-11-01T10:00:00Z",
  },
];

export const demoJobs: ScanJobSummary[] = [
  {
    id: "sample-scan-1",
    query: "has:attachment",
    status: "completed",
    processed: 30,
    found: 8,
    error: null,
    createdAt: "2026-11-08T09:30:00Z",
    updatedAt: "2026-11-08T09:34:00Z",
  },
  {
    id: "sample-scan-2",
    query: "has:attachment filename:pdf",
    status: "completed",
    processed: 10,
    found: 2,
    error: null,
    createdAt: "2026-11-07T09:30:00Z",
    updatedAt: "2026-11-07T09:32:00Z",
  },
];

export const demoSummary: WorkspaceSummary = {
  totalFiles: demoFiles.length,
  indexedBytes: demoFiles.reduce((sum, file) => sum + file.size, 0),
  latestJob: demoJobs[0],
  connection: {
    provider: "gmail",
    email: "alex@example.com",
    name: "Alex Morgan",
    connected: true,
  },
  scanEnabled: true,
};
