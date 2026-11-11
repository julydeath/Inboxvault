import type { FileItem } from "./types";
import { formatBytes } from "./format";

export async function downloadAttachment(
  file: FileItem,
  demo: boolean,
): Promise<void> {
  let blob: Blob;
  if (demo) {
    blob = new Blob(
      [
        `InboxVault · Fictional sample\n\nThis is a sample metadata receipt, not the original attachment.\nFile: ${file.filename}\nType: ${file.mimeType}\nSize: ${formatBytes(file.size)}\nNo Gmail account was accessed.\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
  } else {
    const response = await fetch(`/api/files/${file.id}/download`, {
      cache: "no-store",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "The file could not be downloaded.");
    }
    blob = await response.blob();
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = demo ? file.filename + ".sample.txt" : file.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
