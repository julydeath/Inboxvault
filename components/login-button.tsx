"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { GmailMark, Icon } from "./icon";
export default function LoginButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <button
        className="button button-violet full-width"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await signIn("google", { callbackUrl: "/dashboard" });
          } catch {
            setError("Google sign-in could not start. Please try again.");
            setBusy(false);
          }
        }}
      >
        <GmailMark size={20} />
        {busy ? "Opening Google…" : "Continue with Google"}
        <Icon name="arrow" size={17} />
      </button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
