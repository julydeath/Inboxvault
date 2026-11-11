import { fileKind } from "@/lib/format";
import { Icon } from "./icon";

export function FileBadge({
  mime,
  small = false,
}: {
  mime: string;
  small?: boolean;
}) {
  const kind = fileKind(mime);
  return (
    <span
      aria-hidden="true"
      className={`file-badge file-${kind.toLowerCase()} ${small ? "file-badge-small" : ""}`}
    >
      <Icon name="file" size={small ? 18 : 22} />
      <span>{kind}</span>
    </span>
  );
}
