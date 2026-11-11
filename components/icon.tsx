import type { CSSProperties } from "react";

const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  diagonal: "M7 17 17 7M7 7h10v10",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  folder: "M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3z",
  scan: "M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M4 12h16",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  shield: "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7zM8 12l3 3 5-6",
  mail: "M3 5h18v14H3zM3 5l9 8 9-8",
  file: "M5 2h9l5 5v15H5zM14 2v6h5M8 13h8m-8 4h6",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  plus: "M12 5v14M5 12h14",
  logout: "M9 3H3v18h6m6-15 6 6-6 6M8 12h13",
  menu: "M3 6h18M3 12h18M3 18h18",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z",
  link: "m10 14 4-4m-6-1L5 12a4 4 0 0 0 6 6l3-3m-4-6 3-3a4 4 0 0 1 6 6l-3 3",
  info: "M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
} as const;

export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 20,
  className = "",
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function GmailMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 20" aria-hidden="true">
      <path fill="#4285F4" d="M1 5v13h4V8z" />
      <path fill="#34A853" d="M19 8v10h4V5z" />
      <path fill="#EA4335" d="m1 5 4-3 7 5 7-5 4 3-11 8z" />
      <path fill="#FBBC04" d="M19 2v6l4-3V3a2 2 0 0 0-4-1" />
      <path fill="#C5221F" d="M1 3v2l4 3V2a2 2 0 0 0-4 1" />
    </svg>
  );
}
