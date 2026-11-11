"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  DIRECT_DOWNLOAD_LIMIT,
  fileKind,
  formatBytes,
  formatDate,
} from "@/lib/format";
import type { FileItem, WorkspaceSummary, WorkspaceView } from "@/lib/types";
import { Brand } from "./brand";
import { FileBadge } from "./file-badge";
import { GmailMark, Icon } from "./icon";
import { useWorkspace } from "./use-workspace";
import { downloadAttachment } from "@/lib/download";
import { Modal } from "./workspace-dialog";
import { ScanActivity } from "./scan-activity";
import { navigation } from "./workspace-navigation";

export default function Dashboard({
  initialSummary,
  view,
  demo = false,
}: {
  initialSummary: WorkspaceSummary;
  view: WorkspaceView;
  demo?: boolean;
}) {
  const state = useWorkspace(initialSummary, demo);
  const {
    summary,
    files,
    jobs,
    search,
    setSearch,
    mime,
    setMime,
    loading,
    busy,
    error,
    notice,
  } = state;
  const [mobileNav, setMobileNav] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [selected, setSelected] = useState<FileItem | null>(null);
  const [query, setQuery] = useState("has:attachment");
  const [advanced, setAdvanced] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const base = demo ? "/demo" : "/dashboard";
  const job = summary.latestJob;
  const active = job && ["queued", "running"].includes(job.status);
  const displayName = summary.connection.name.split(" ")[0] || "there";
  const initial = summary.connection.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const current = navigation.find((item) => item.view === view)!;
  const titles = {
    overview: "A little more clarity.",
    files: "A home for your files.",
    scans: "Every scan, accounted for.",
    settings: "Make yourself at home.",
  };
  const subtitles = {
    overview: `Welcome back, ${displayName}. Your inbox can keep the conversations.`,
    files: "Everything you need, without the email thread.",
    scans: "Pick up where you left off. See what you’ve found.",
    settings: "Your connection, your account, your space.",
  };

  async function download(file: FileItem) {
    if (downloadId || file.size > DIRECT_DOWNLOAD_LIMIT) return;
    setDownloadId(file.id);
    state.setError("");
    try {
      await downloadAttachment(file, demo);
      if (demo)
        state.setNotice(
          "Downloaded a sample metadata receipt (.txt). No real attachment was accessed.",
        );
    } catch (e) {
      state.setError(
        e instanceof Error ? e.message : "Download failed. Please try again.",
      );
    } finally {
      setDownloadId(null);
    }
  }

  async function createScan(event: FormEvent) {
    event.preventDefault();
    if (await state.start(query.trim() || "has:attachment")) setScanOpen(false);
  }

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#workspace-main">
        Skip to workspace
      </a>
      {mobileNav && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside
        className={`workspace-sidebar ${mobileNav ? "mobile-open" : ""}`}
        aria-label="Workspace navigation"
      >
        <Brand />
        <div className="workspace-name">
          <span className="workspace-avatar">{initial}</span>
          <div>
            <strong>Personal workspace</strong>
            <small>{demo ? "Demo environment" : "Private preview"}</small>
          </div>
          <Icon name="down" size={13} />
        </div>
        <span className="sidebar-label">YOUR SPACE</span>
        <nav>
          {navigation.map((item) => (
            <Link
              className={`workspace-nav-link ${view === item.view ? "active" : ""}`}
              href={base + item.href}
              key={item.view}
              aria-current={view === item.view ? "page" : undefined}
              onClick={() => setMobileNav(false)}
            >
              <Icon name={item.icon} size={19} />
              {item.label}
              {item.view === "files" && <span>{summary.totalFiles}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-connection">
            <GmailMark size={19} />
            <div>
              <strong>Gmail</strong>
              <span>
                <i
                  className={`status-dot ${!summary.connection.connected ? "offline-dot" : ""}`}
                />
                {demo
                  ? "Sample connection"
                  : summary.connection.connected
                    ? "Connected"
                    : "Reconnect needed"}
              </span>
            </div>
            <Link
              href={base + "/settings"}
              aria-label="Gmail connection settings"
            >
              <Icon name="settings" size={16} />
            </Link>
          </div>
          <div className="sidebar-profile">
            <span className="profile-avatar">{initial}</span>
            <div>
              <strong>{summary.connection.name}</strong>
              <small>{summary.connection.email}</small>
            </div>
            {demo ? (
              <Link href="/" className="icon-button" aria-label="Leave demo">
                <Icon name="logout" size={17} />
              </Link>
            ) : (
              <button
                className="icon-button"
                aria-label="Sign out"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <Icon name="logout" size={17} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="workspace-body">
        <header className="workspace-topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Icon name="menu" />
            </button>
            <span className="breadcrumb-home">Workspace</span>
            <Icon name="chevron" size={12} />
            <span>{current.label}</span>
          </div>
          <span className="workspace-private">
            <Icon name="shield" size={14} /> Private preview
          </span>
        </header>
        {demo && (
          <div className="demo-banner">
            <div>
              <span className="demo-indicator">DEMO</span>
              <span>A real feel. Fictional files. No inbox connected.</span>
            </div>
            <Link href="/connect">
              Make it your own <Icon name="arrow" size={14} />
            </Link>
          </div>
        )}
        <main className="workspace-content" id="workspace-main">
          <div className="workspace-page-header">
            <div>
              <span className="eyebrow">
                {view === "overview"
                  ? "A SPACE TO THINK CLEARLY"
                  : current.label.toUpperCase()}
              </span>
              <h1>{titles[view]}</h1>
              <p>{subtitles[view]}</p>
            </div>
            {view !== "settings" && (
              <button
                className="button button-violet"
                onClick={() => {
                  state.setError("");
                  setScanOpen(true);
                }}
                disabled={
                  busy ||
                  Boolean(active) ||
                  !summary.connection.connected ||
                  !summary.scanEnabled
                }
              >
                <Icon name="plus" size={17} /> New scan
              </button>
            )}
          </div>
          {!summary.scanEnabled && (
            <div className="alert">
              <Icon name="info" size={18} />
              <span>
                Scanning is available in the local private preview. This
                production build does not have a background worker configured.
              </span>
            </div>
          )}
          {!summary.connection.connected && (
            <div className="alert">
              <Icon name="mail" size={18} />
              <span>
                Reconnect Gmail to scan and download your attachments.
              </span>
              <Link href="/connect">
                Reconnect <Icon name="arrow" size={14} />
              </Link>
            </div>
          )}
          {error && (
            <div className="alert alert-error" role="alert">
              <Icon name="info" size={18} />
              <span>{error}</span>
              <button
                className="text-button"
                onClick={() => {
                  state.setError("");
                  void state.refresh().catch((e) => state.setError(e.message));
                }}
              >
                Retry
              </button>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => state.setError("")}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          <div className="sr-only" aria-live="polite">
            {busy ? "Processing a scan batch." : notice}
          </div>
          {notice && (
            <div className="notice-toast">
              <Icon name="check" size={17} />
              <span>{notice}</span>
              <button
                className="icon-button"
                aria-label="Dismiss notification"
                onClick={() => state.setNotice("")}
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          )}

          {view === "overview" && (
            <>
              <div className="workspace-stats">
                <div className="workspace-stat">
                  <div>
                    <span>Files in your library</span>
                    <Icon name="folder" size={18} />
                  </div>
                  <strong>
                    {summary.totalFiles.toLocaleString()}
                    <small>files</small>
                  </strong>
                  <p>
                    {demo
                      ? "Fictional attachments, real possibilities"
                      : "Unique attachments indexed from Gmail"}
                  </p>
                </div>
                <div className="workspace-stat">
                  <div>
                    <span>Total indexed size</span>
                    <Icon name="file" size={18} />
                  </div>
                  <strong>
                    {formatBytes(summary.indexedBytes).split(" ")[0]}
                    <small>
                      {formatBytes(summary.indexedBytes).split(" ")[1]}
                    </small>
                  </strong>
                  <p>File contents stay in your Gmail</p>
                </div>
                <div className="workspace-stat">
                  <div>
                    <span>Messages checked</span>
                    <Icon name="scan" size={18} />
                  </div>
                  <strong>
                    {(job?.processed || 0).toLocaleString()}
                    <small>in latest scan</small>
                  </strong>
                  <p>
                    <span className="status-dot" />
                    {job
                      ? job.status === "completed"
                        ? "Latest scan complete"
                        : `Latest scan ${job.status}`
                      : "Ready for your first scan"}
                  </p>
                </div>
              </div>
              <div className="workspace-welcome">
                <div>
                  <span className="eyebrow">
                    KEEP THE CONVERSATIONS. FIND THE FILES.
                  </span>
                  <h2>
                    Your inbox has a lot to say.
                    <br />
                    Let’s find what you came for.
                  </h2>
                  <p>
                    Turn scattered attachments into a library that makes sense.
                  </p>
                  <Link
                    className="text-link violet-link"
                    href={base + "/files"}
                  >
                    Explore your attachments <Icon name="arrow" size={17} />
                  </Link>
                </div>
                <div className="welcome-file-stack" aria-hidden="true">
                  <div>
                    <FileBadge mime="application/pdf" />
                    <span>PDF</span>
                  </div>
                  <div>
                    <FileBadge mime="image/jpeg" />
                    <span>Images</span>
                  </div>
                  <div>
                    <FileBadge mime="application/zip" />
                    <span>And more.</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {(view === "overview" ||
            (view !== "settings" && active) ||
            (view === "scans" && job?.status === "failed")) &&
            job && (
              <ScanActivity
                job={job}
                busy={busy}
                enabled={summary.scanEnabled}
                connected={summary.connection.connected}
                onRun={() => void state.run()}
              />
            )}
          {view === "overview" && !job && (
            <section className="first-scan-card">
              <span className="empty-symbol">
                <Icon name="scan" size={28} />
              </span>
              <div>
                <h3>Your first moment of clarity.</h3>
                <p>
                  Start a scan to find attachments in your Gmail. Each batch
                  checks up to ten messages.
                </p>
              </div>
              <button
                className="button button-outline"
                disabled={!summary.connection.connected || !summary.scanEnabled}
                onClick={() => setScanOpen(true)}
              >
                Start your first scan <Icon name="arrow" size={16} />
              </button>
            </section>
          )}

          {(view === "overview" || view === "files") && (
            <section className="file-library">
              <div className="panel-heading">
                <div>
                  <h2>
                    {view === "overview"
                      ? "Your attachment library"
                      : "All attachments"}
                    <span className="count-label">{summary.totalFiles}</span>
                  </h2>
                  <p>
                    {view === "overview"
                      ? "A few things you don’t have to look for anymore."
                      : "Search by filename, or narrow things down by type."}
                  </p>
                </div>
                {view === "overview" && (
                  <Link
                    className="text-link violet-link"
                    href={base + "/files"}
                  >
                    View all files <Icon name="arrow" size={15} />
                  </Link>
                )}
              </div>
              <div className="library-controls">
                <label className="search-field">
                  <Icon name="search" size={19} />
                  <input
                    aria-label="Search filenames"
                    placeholder="Find that file…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    maxLength={150}
                  />
                  {search && (
                    <button
                      className="icon-button"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <Icon name="close" size={15} />
                    </button>
                  )}
                </label>
                <label className="type-select">
                  <span className="sr-only">Filter file types</span>
                  <select
                    aria-label="Filter file types"
                    value={mime}
                    onChange={(event) => setMime(event.target.value)}
                  >
                    <option value="">All file types</option>
                    <option value="application/pdf">PDF documents</option>
                    <option value="image/">Images</option>
                    <option value="video/">Video</option>
                    <option value="audio/">Audio</option>
                    <option value="application/">Documents & archives</option>
                  </select>
                </label>
              </div>
              <div className="file-table-wrap">
                <table className="file-table">
                  <thead>
                    <tr>
                      <th scope="col">File name</th>
                      <th scope="col">Type</th>
                      <th scope="col">Size</th>
                      <th scope="col">Email date</th>
                      <th scope="col">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && files.length === 0
                      ? Array.from({ length: 4 }, (_, index) => (
                          <tr
                            key={index}
                            className="skeleton-row"
                            aria-hidden="true"
                          >
                            <td>
                              <span />
                            </td>
                            <td>
                              <span />
                            </td>
                            <td>
                              <span />
                            </td>
                            <td>
                              <span />
                            </td>
                            <td />
                          </tr>
                        ))
                      : files
                          .slice(0, view === "overview" ? 5 : undefined)
                          .map((file) => (
                            <tr key={file.id}>
                              <td>
                                <button
                                  className="file-name-button"
                                  onClick={() => setSelected(file)}
                                >
                                  <FileBadge mime={file.mimeType} small />
                                  <span>{file.filename}</span>
                                </button>
                              </td>
                              <td>
                                <span className="file-type-label">
                                  {fileKind(file.mimeType)}
                                </span>
                              </td>
                              <td>{formatBytes(file.size)}</td>
                              <td>{formatDate(file.emailDate)}</td>
                              <td>
                                <button
                                  className="icon-button file-download"
                                  disabled={
                                    downloadId !== null ||
                                    file.size > DIRECT_DOWNLOAD_LIMIT
                                  }
                                  title={
                                    file.size > DIRECT_DOWNLOAD_LIMIT
                                      ? "Direct download supports files up to 15 MB"
                                      : demo
                                        ? "Download a sample metadata receipt (.txt)"
                                        : "Download attachment"
                                  }
                                  aria-label={`${demo ? "Download sample details for" : "Download"} ${file.filename}`}
                                  onClick={() => void download(file)}
                                >
                                  <Icon name="download" size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                  </tbody>
                </table>
              </div>
              {loading && (
                <span className="sr-only" role="status">
                  Loading attachments…
                </span>
              )}
              {!loading && !state.filesError && files.length === 0 && (
                <div className="empty-state">
                  <span className="empty-symbol">
                    <Icon
                      name={search || mime ? "search" : "folder"}
                      size={27}
                    />
                  </span>
                  <h3>
                    {search || mime
                      ? "No files match just yet."
                      : "A clear space, ready for your files."}
                  </h3>
                  <p>
                    {search || mime
                      ? "Try another filename or a different file type."
                      : "Start your first Gmail scan to bring your attachments together."}
                  </p>
                  {search || mime ? (
                    <button
                      className="button button-outline"
                      onClick={() => {
                        setSearch("");
                        setMime("");
                      }}
                    >
                      Clear filters
                    </button>
                  ) : (
                    <button
                      className="button button-violet"
                      disabled={
                        busy ||
                        Boolean(active) ||
                        !summary.connection.connected ||
                        !summary.scanEnabled
                      }
                      onClick={() => setScanOpen(true)}
                    >
                      <Icon name="plus" size={16} /> New scan
                    </button>
                  )}
                </div>
              )}
              {!loading && state.filesError && (
                <div className="empty-state">
                  <span className="empty-symbol">
                    <Icon name="info" size={27} />
                  </span>
                  <h3>Your files couldn’t be loaded.</h3>
                  <p>Try again to reload your attachment library.</p>
                  <button
                    className="button button-outline"
                    onClick={() => {
                      state.setError("");
                      void state
                        .refresh()
                        .catch((e) => state.setError(e.message));
                    }}
                  >
                    Retry loading files
                  </button>
                </div>
              )}
              <div className="library-table-footer">
                <span>
                  {demo
                    ? "Sample files · metadata receipts only"
                    : "Metadata only · Downloads directly from Gmail"}
                </span>
                {view === "files" && state.cursor ? (
                  <button
                    className="text-button"
                    disabled={loading}
                    onClick={() => void state.loadMore()}
                  >
                    {loading ? "Loading…" : "Load more files"}
                    <Icon name="down" size={14} />
                  </button>
                ) : (
                  <span>
                    {loading
                      ? "Loading…"
                      : `${Math.min(files.length, view === "overview" ? 5 : files.length)} shown`}
                  </span>
                )}
              </div>
            </section>
          )}

          {view === "scans" && (
            <section className="history-panel">
              <div className="panel-heading">
                <div>
                  <h2>Scan history</h2>
                  <p>
                    Your latest 20 scans. Batches continue only when you choose.
                  </p>
                </div>
              </div>
              {jobs.length ? (
                <div className="scan-history-list">
                  {jobs.map((scan) => (
                    <article key={scan.id}>
                      <span className={`history-icon status-${scan.status}`}>
                        <Icon
                          name={scan.status === "completed" ? "check" : "scan"}
                          size={20}
                        />
                      </span>
                      <div>
                        <h3>{scan.query}</h3>
                        <p>
                          {formatDate(scan.createdAt)} <span>·</span>{" "}
                          {scan.processed} messages checked <span>·</span>{" "}
                          {scan.found} attachments found
                        </p>
                        {scan.error && (
                          <p className="error-text">{scan.error}</p>
                        )}
                      </div>
                      <span className={`status-pill status-${scan.status}`}>
                        {scan.status}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-symbol">
                    <Icon name="clock" size={28} />
                  </span>
                  <h3>A fresh start.</h3>
                  <p>
                    Your scans will appear here once you create your first one.
                  </p>
                </div>
              )}
            </section>
          )}

          {view === "settings" && (
            <div className="settings-grid">
              <section className="settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Your connected inbox</h2>
                    <p>One connection. A clearer view of your files.</p>
                  </div>
                </div>
                <div className="settings-account">
                  <span className="settings-gmail">
                    <GmailMark size={29} />
                  </span>
                  <div>
                    <h3>Gmail</h3>
                    <p>{summary.connection.email}</p>
                  </div>
                  <span
                    className={`status-pill ${summary.connection.connected ? "status-completed" : "status-failed"}`}
                  >
                    {demo
                      ? "Sample"
                      : summary.connection.connected
                        ? "Connected"
                        : "Disconnected"}
                  </span>
                </div>
                <dl className="settings-details">
                  <div>
                    <dt>Access level</dt>
                    <dd>Read-only</dd>
                  </div>
                  <div>
                    <dt>File storage</dt>
                    <dd>Original files stay in Gmail</dd>
                  </div>
                  <div>
                    <dt>Scan mode</dt>
                    <dd>Manual · 10 messages per batch</dd>
                  </div>
                  <div>
                    <dt>Direct download limit</dt>
                    <dd>15 MB per file</dd>
                  </div>
                </dl>
                <div className="settings-actions">
                  <Link className="button button-outline" href="/connect">
                    {demo ? "Connect your own Gmail" : "Reconnect Gmail"}
                    <Icon name="arrow" size={16} />
                  </Link>
                  {demo ? (
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={state.resetDemo}
                    >
                      Reset demo
                    </button>
                  ) : (
                    <button
                      className="text-button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      Sign out
                    </button>
                  )}
                </div>
              </section>
              <section className="settings-panel settings-privacy">
                <span className="privacy-panel-icon">
                  <Icon name="shield" size={26} />
                </span>
                <h2>Your files. Your boundaries.</h2>
                <p>
                  We index attachment names, types, sizes, and dates. Contents
                  are retrieved from Gmail only when you request a download.
                </p>
                <p>
                  This is a private developer preview. Account deletion and
                  access-revocation controls are required before public release.
                </p>
                <a
                  className="text-link violet-link"
                  href="https://myaccount.google.com/connections"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Manage Google account access{" "}
                  <Icon name="diagonal" size={15} />
                </a>
                <div className="upcoming-provider">
                  <Icon name="mail" size={20} />
                  <div>
                    <strong>Outlook</strong>
                    <span>Planned for a future release</span>
                  </div>
                  <span className="subtle-pill">Coming later</span>
                </div>
              </section>
            </div>
          )}

          <footer className="workspace-footer">
            <span>
              <Icon name="shield" size={13} /> A little order, with your privacy
              in mind.
            </span>
            <span>
              InboxVault · {demo ? "Sample workspace" : "Private preview"}
            </span>
          </footer>
        </main>
      </div>

      {scanOpen && (
        <Modal
          title="Create a scan"
          onClose={() => {
            if (!busy) setScanOpen(false);
          }}
        >
          <span className="dialog-symbol">
            <Icon name="scan" size={28} />
          </span>
          <h2>A little inbox archaeology.</h2>
          <p className="dialog-description">
            {demo
              ? "Try a simulated scan using fictional messages. Your Gmail is never accessed."
              : "Choose what to look for. We’ll index attachment details without changing your emails."}
          </p>
          <form onSubmit={createScan}>
            <label className="field-label">What would you like to find?</label>
            <div className="scan-presets">
              <button
                type="button"
                aria-pressed={query === "has:attachment"}
                className={query === "has:attachment" ? "selected" : ""}
                onClick={() => setQuery("has:attachment")}
              >
                <Icon name="folder" size={20} />
                <strong>All attachments</strong>
                <span>A little bit of everything</span>
              </button>
              <button
                type="button"
                aria-pressed={query === "has:attachment filename:pdf"}
                className={
                  query === "has:attachment filename:pdf" ? "selected" : ""
                }
                onClick={() => setQuery("has:attachment filename:pdf")}
              >
                <Icon name="file" size={20} />
                <strong>Just PDFs</strong>
                <span>Documents, without the noise</span>
              </button>
            </div>
            <button
              type="button"
              className="advanced-toggle"
              aria-expanded={advanced}
              onClick={() => setAdvanced(!advanced)}
            >
              Use a Gmail search query <Icon name="down" size={15} />
            </button>
            {advanced && (
              <div className="advanced-field">
                <label htmlFor="scan-query" className="field-label">
                  Gmail search query
                </label>
                <input
                  id="scan-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  maxLength={400}
                  required
                />
                <p>Example: has:attachment after:2026/01/01</p>
              </div>
            )}
            <div className="scan-explanation">
              <Icon name="info" size={18} />
              <p>
                Each batch checks up to 10 messages. You choose when to
                continue, and can return to your scan later.
              </p>
            </div>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <button
              className="button button-violet full-width"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Preparing your scan…"
                : demo
                  ? "Create sample scan"
                  : "Create scan"}
              <Icon name="arrow" size={17} />
            </button>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal
          title={`File details: ${selected.filename}`}
          onClose={() => setSelected(null)}
          className="file-detail-dialog"
        >
          <FileBadge mime={selected.mimeType} />
          <h2>{selected.filename}</h2>
          <p className="dialog-description">
            {demo
              ? "Fictional sample attachment"
              : "Indexed from your Gmail account"}
          </p>
          <dl className="settings-details file-details">
            <div>
              <dt>File type</dt>
              <dd>{fileKind(selected.mimeType)}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatBytes(selected.size)}</dd>
            </div>
            <div>
              <dt>Email date</dt>
              <dd>{formatDate(selected.emailDate)}</dd>
            </div>
            <div>
              <dt>Original location</dt>
              <dd>{demo ? "Fictional Gmail inbox" : "Your Gmail inbox"}</dd>
            </div>
          </dl>
          {selected.size > DIRECT_DOWNLOAD_LIMIT && (
            <div className="alert">
              This file exceeds the 15 MB direct-download limit. Large-file
              delivery is planned for a future release.
            </div>
          )}
          {demo && (
            <p className="detail-footnote">
              Demo downloads contain a plain-text metadata receipt, not the
              pictured attachment.
            </p>
          )}
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button-violet full-width"
            disabled={
              downloadId !== null || selected.size > DIRECT_DOWNLOAD_LIMIT
            }
            onClick={() => void download(selected)}
          >
            <Icon name="download" size={18} />
            {downloadId === selected.id
              ? "Preparing download…"
              : demo
                ? "Download sample details (.txt)"
                : "Download attachment"}
          </button>
        </Modal>
      )}
    </div>
  );
}
