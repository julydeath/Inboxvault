import Link from "next/link";
import { Brand } from "./brand";
import { GmailMark, Icon } from "./icon";
import LoginButton from "./login-button";

export function ConnectionPanel({
  ready,
  error,
  workspaceError = false,
}: {
  ready: boolean;
  error?: string;
  workspaceError?: boolean;
}) {
  return (
    <main className="connect-page">
      <div className="connect-nav">
        <Brand />
        <Link href="/">
          Back to home <Icon name="arrow" size={16} />
        </Link>
      </div>
      <div className="connect-layout">
        <div className="connect-editorial">
          <span className="eyebrow">LESS SEARCHING. MORE FINDING.</span>
          <h1>
            Your next file
            <br />
            is closer
            <br />
            <span>than you think.</span>
          </h1>
          <p>
            Give your Gmail attachments a space of their own.
            <br />
            Your inbox can keep the conversations.
          </p>
          <div className="connect-graphic">
            <span>
              <Icon name="mail" size={28} />
            </span>
            <i />
            <span>
              <Icon name="folder" size={28} />
            </span>
          </div>
        </div>
        <section className="connect-card">
          <span className="connect-gmail">
            <GmailMark size={33} />
          </span>
          <h2>
            {workspaceError
              ? "Your workspace needs a moment."
              : "A clearer inbox starts here."}
          </h2>
          <p>
            Connect an approved Google test account to find and organize your
            attachments.
          </p>
          {error && (
            <div role="alert" className="alert alert-error">
              {error}
            </div>
          )}
          {!ready ? (
            <div className="setup-note">
              <Icon name="info" size={20} />
              <div>
                <strong>Gmail connection is being prepared</strong>
                <p>
                  This preview needs a database and Google sign-in configuration
                  before real inboxes can connect. You can explore the complete
                  sample workspace now.
                </p>
              </div>
            </div>
          ) : workspaceError ? (
            <Link className="button button-violet full-width" href="/dashboard">
              Try loading workspace again <Icon name="arrow" size={17} />
            </Link>
          ) : (
            <LoginButton />
          )}
          <Link href="/demo" className="button button-outline full-width">
            Explore with sample files <Icon name="diagonal" size={17} />
          </Link>
          <div className="connect-permissions">
            <Icon name="shield" size={18} />
            <p>
              Read-only Gmail access. We don’t send, edit, or delete your
              emails. Attachment contents stay in Gmail until downloaded.
            </p>
          </div>
          <small className="connect-preview">
            PRIVATE DEVELOPER PREVIEW · GMAIL ONLY
          </small>
        </section>
      </div>
    </main>
  );
}
