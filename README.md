# InboxVault

A private Gmail attachment workspace with a cinematic product website, an interactive sample environment, and authenticated file indexing and downloads.

## Try the interface

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` for the product website or `http://localhost:3000/demo` for the interactive demo. The demo needs neither a database nor a Google account. It contains fictional files, simulated scan batches, and plain-text metadata receipts for sample downloads. Its state lives in the current browser tab’s session storage; reset it in Demo → Settings.

The landing page explains attachment extraction through a scroll-driven email-to-library sequence. Mobile and reduced-motion layouts provide a simplified presentation. Fonts are served locally.

## Connect a real Gmail test account

1. Prepare a private PostgreSQL database.
2. Create a Google Cloud project, enable the Gmail API, keep OAuth consent in **Testing**, and add your explicitly authorized test account. Register a Web OAuth client with callback `http://localhost:3000/api/auth/callback/google`.
3. Copy `.env.example` to `.env.local`. Set `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and `TOKEN_ENCRYPTION_KEY`. Generate the encryption key using `openssl rand -hex 32`. Never commit secrets.
4. Run `npm run db:push`, then `npm run dev`.
5. Open `/connect`, sign in, and create a scan. Start with the all-attachments or PDF preset, or use an advanced Gmail query.
6. Choose **Process 10 messages** for each batch. Progress survives reloads. An active scan must finish before another is created.

The schema adds lease and message-page checkpoint fields to `ScanJob`. Existing development databases need `npm run db:push` before scanning; existing attachment records are retained. There is one canonical application in the repository root.

Missing integration configuration shows an explanation and a link to the demo. Database outages show a retry state. Live Gmail credentials are not included, and no real inbox has been used in automated testing.

## Workspace

- `/dashboard` — accurate library totals, latest scan, and recent attachment rows.
- `/dashboard/files` — filename search, MIME filtering, pagination, metadata details, individual downloads.
- `/dashboard/scans` — latest 20 scans and continuation of the latest active scan.
- `/dashboard/settings` — connection details, reconnect, sign-out, and Google account access link.
- `/demo` and the equivalent subroutes — an isolated sample workspace.

Downloads fetch file contents from Gmail on demand and support files up to **15,000,000 bytes**. Larger attachments remain indexed but cannot be downloaded in this preview. Scanning uses explicit development-only batches; `next start` can serve the interface and library but does **not** enable scanning. Use `npm run dev` for controlled local Gmail testing.

Tokens are encrypted with AES-256-GCM. Attachment, scan, and summary queries are scoped to the signed-in user. Scans snapshot each Gmail result page, use a database lease to exclude simultaneous batches, and transactionally checkpoint each message with its attachments. These are private-preview safeguards, not a durable production queue.

## API

- `GET /api/summary` — database-backed unique file count, indexed bytes, latest scan, connection summary, and scan availability.
- `GET /api/files?search=&mime=&cursor=` — up to 50 attachment metadata records plus a continuation cursor.
- `GET /api/files/:id/download` — authenticated on-demand download.
- `GET /api/jobs` — latest 20 scan summaries.
- `POST /api/jobs` with `{ "query": "has:attachment" }` — create one scan.
- `POST /api/jobs/:id/run` — process the next batch of up to ten messages, disabled in production.

File and job responses omit Gmail refresh tokens, internal page snapshots, and lease credentials. The MIME filter accepts a prefix (e.g. `image/`) or a full MIME type. “Documents & archives” matches `application/` and therefore includes PDFs.

## Verification

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium --only-shell
npm run test:e2e
```

The browser suite covers the product story, mobile navigation, reduced motion, search and filters, file-detail dialogs, honest sample downloads, explicit scan batches, reload/navigation persistence, unconfigured integration behavior, and automated accessibility checks for the workspace and scan dialog. Screenshots are written to ignored `artifacts/`. A GitHub Actions workflow runs unit checks, a production build, and the browser suite. Patched transitive dependencies are pinned through npm overrides; review these when upgrading Prisma or Google APIs. Development uses `.next-dev/` and builds use `.next/` so the outputs do not conflict.

For database-backed verification, install PostgreSQL locally so `initdb` and `pg_ctl` are on PATH, then run:

```sh
npm run test:integration
```

This creates a **disposable PostgreSQL cluster**, seeds two fictional tenants, and runs the browser/API suite. It checks unauthorized access, cross-account isolation, accurate totals, multiple file pages, oversized downloads, conflicting scan creation, and batch leases. It stops and removes its own test database afterward. It never uses your configured application database or calls Gmail.

## Remaining production milestones

This is a controlled developer preview, not a public Gmail launch. The repository’s original launch review remains applicable: confirm the actual Gmail use case and required verification against [Google Workspace API user-data policy](https://developers.google.com/workspace/workspace-api-user-data-developer-policy) and [Gmail scope documentation](https://developers.google.com/workspace/gmail/api/auth/scopes) before a public release.

Remaining work includes a durable worker/queue, quotas and backoff, retention and deletion/revocation controls, monitoring, abuse prevention, file-content security, privacy/terms review, and regular dependency review. Bulk ZIP, large-file delivery, Drive exports, scheduled sync, billing, email-body parsing, and Outlook are future features. There is no public deployment configured.
