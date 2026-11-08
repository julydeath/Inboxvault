# InboxVault — developer preview

Multi-user Gmail attachment indexer prototype, separate from Inspirex ATS.

## IMPORTANT: policy and launch block

Google's Workspace API user data policy disallows some one-time/manual email export applications. Before launching this concept publicly, confirm that the specific ongoing backup/productivity use case is eligible for Gmail API scopes. `gmail.readonly` is a restricted scope and can require verification and an external security assessment when restricted Gmail data is handled on servers. This prototype is for controlled testing only; it is **not** publicly launch-ready. See https://developers.google.com/workspace/workspace-api-user-data-developer-policy and https://developers.google.com/workspace/gmail/api/auth/scopes .

## Current features
- Google sign-in with Gmail read-only consent (development/testing only)
- Per-user encrypted Gmail refresh tokens (AES-256-GCM)
- Historical search via Gmail search queries with page cursor + in-page offsets
- Ten-message manually initiated test batches (no uncontrolled full-inbox scans)
- Metadata index for PDF, DOCX, audio, video, images, archives and other file types
- Search/filter attachment list and authenticated on-demand download for files up to 15 MB
- Per-user data isolation in API queries
- No paywall; no candidate/AI parsing yet

## Setup
1. Create a private PostgreSQL database.
2. Create a Google Cloud project, enable Gmail API, configure OAuth consent in **Testing** and add explicitly authorized testers. Create a Web OAuth client. Add callback `http://localhost:3000/api/auth/callback/google`. Review Google policy before seeking public approval.
3. Copy `.env.example` to `.env.local`. Set `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and `TOKEN_ENCRYPTION_KEY` (`openssl rand -hex 32`). Do not commit `.env.local`.
4. `npm install && npx prisma db push && npm run dev`
5. Open http://localhost:3000 and sign in with an approved Google test user.
6. Start a scan with `has:attachment`. Press **Process next 10 messages** repeatedly to test pagination and indexing.

## Routes
- `GET /api/jobs` and `POST /api/jobs` — list/create a scan
- `POST /api/jobs/:id/run` — process next test batch (disabled in production)
- `GET /api/files?search=&mime=&cursor=` — paginated file metadata
- `GET /api/files/:id/download` — fetch attachment from Gmail on demand

## Security and production TODOs
- [ ] Google policy approval for actual product use case; OAuth verification/security assessment if needed
- [ ] Production-grade durable queue/worker, database lease, idempotent message processing
- [ ] Rate limit endpoints; enforce per-user quotas and query limits
- [ ] Explicit data deletion, disconnect and revoke controls; retention policy
- [ ] Proper protection against malicious files, content scanning, content disposition and archive bombs
- [ ] Large file streaming/export to user-selected storage; ZIP delivery via background processing
- [ ] Reauthorization/refresh-token lifecycle and reconnect UX
- [ ] Pagination race and concurrency tests; Gmail quota/backoff handling
- [ ] Email privacy policy, terms, security review, audit logging and abuse prevention
- [ ] Automated tests + CI; monitoring and incident response
- [ ] Production billing and subscription entitlements (not enabled)

## Recommended deployment architecture
Vercel for Next.js UI and short API routes, Postgres for metadata/jobs, dedicated background worker and queue for large scans, object storage only if explicitly required. Avoid Vercel Hobby for commercial use (https://vercel.com/docs/plans/hobby).

## Milestones
1. **M0** source project + local smoke test (this repository)
2. **M1** production worker, OAuth and privacy requirements, file filtering and download robustness
3. **M2** bulk ZIP, Google Drive export, deduplication and resumable scheduled sync
4. **M3** user onboarding, multi-tenant limits, observability, billing
5. **M4** optional Inspirex ATS integration and broader storage connectors

## GitHub publication (not done)
Create your own **private** repo via GitHub browser or Codex. Then from project directory:
`git init && git add . && git commit -m "feat: initial Gmail attachment indexing prototype" && git branch -M main && git remote add origin https://github.com/YOUR_ACCOUNT/inboxvault.git && git push -u origin main`

No GitHub credentials or repo write connection were available during creation. This project has not been pushed or deployed.
