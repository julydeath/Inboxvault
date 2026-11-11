import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";

export default function NotFound() {
  return (
    <main className="connect-page">
      <div className="connect-nav">
        <Brand />
      </div>
      <section className="empty-state" style={{ padding: "110px 24px" }}>
        <span className="eyebrow">404 · A SMALL DETOUR</span>
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            letterSpacing: "-2px",
            marginTop: 24,
          }}
        >
          This page got lost in the inbox.
        </h1>
        <p>
          The page you’re looking for isn’t here. Let’s get you back to a
          clearer space.
        </p>
        <Link className="button button-violet" href="/">
          Back to home <Icon name="arrow" size={17} />
        </Link>
      </section>
    </main>
  );
}
