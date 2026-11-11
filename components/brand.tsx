import Link from "next/link";

export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${dark ? "brand-dark" : ""}`}
      aria-label="InboxVault home"
    >
      <svg
        width="30"
        height="32"
        viewBox="0 0 30 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m15 2 12 6v16l-12 6L3 24V8z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="m3 8 12 6 12-6M15 14v16M8 5.5l12 6v8l-5 2.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        inboxvault<span className="brand-period">.</span>
      </span>
    </Link>
  );
}
