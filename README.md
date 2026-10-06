# Redlyn rebuild

A working independent reconstruction of the public Redlyn design and its primary visual feedback workflows. The public website and signed-in dashboard, review, Team, Settings and Usage screens were compared with a user-provided reference session on October 1–3, 2026. This is an independent reconstruction, with the remaining differences recorded in `qa/comparison-report.md`.

## Deploy to Vercel

Follow [the Vercel setup guide](docs/VERCEL-SETUP.md). The Node serverless adapter supports your Firebase Firestore database; see [Firebase setup](docs/FIREBASE-SETUP.md). The free Firebase setup disables image, screenshot and voice uploads. Turso and private Vercel Blob remain available as an alternative. `vercel.json` configures the API/preview routes and frontend. Set the required database/storage environment variables and redeploy before testing accounts and feedback. Never use a local SQLite file as a Vercel production database. Existing local or ChatGPT Site data is not copied automatically.

```sh
npm ci
npm test
npm run build:vercel
```

Uploads on Vercel are limited to 4 MiB per file. Optional Google, Resend and Dodo integrations still require provider setup.

## Run locally

Requires Node 22.18+ with `node:sqlite` support.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Create an email/password account, then choose **Create demo** to test the complete feedback workflow. With Firebase credentials in `.env`, local development uses Firestore and disables uploads. Without them, local data is persisted in `.data/redlyn.sqlite` and attachments in `.data/media`. That directory is ignored by Git and is never uploaded.

```sh
npm test
npm run build
```

## Implemented

- Responsive public homepage, comparison, pricing sections, FAQs, light/dark mode and provisional policy pages.
- Email/password accounts, secure HTTP-only sessions, profiles and logout.
- Inline URL review creation, dashboard status filters, grid/list layouts, search, archive/restore, activity timeline, screenshot covers and CSV export.
- Workspace switcher, workspace-wide membership, optional-email invitation links, role management, workspace renaming and real UTC daily/monthly activity counts.
- Project team roles and email-bound invitation links, with optional Resend delivery.
- Authenticated team reviews and independent client review sessions.
- Hashed client tokens, password protection, optional required email, expiry, immediate revocation and separate comment/approval permissions.
- Desktop, tablet, phone and custom viewport sizes, separate pin groups and page URL navigation.
- Public/internal feedback, priority, assignee, threaded public/internal replies, image/file attachments and 90-second voice recording.
- Open, in-progress, in-review, resolved, reopened and approved statuses. Client confirmation and page approvals.
- Keyboard shortcuts and seven-second polling for updates.
- Server-side filtering of private feedback, replies, activity and media. All attachment reads are authorized.
- Cloudflare Worker deployment output, D1 schema/migrations and R2 media binding.

## Website preview support

Public HTTPS pages can load through an isolated no-install preview with injected review tools. Tokens expire after one hour and are checked against current project, workspace or client-link access. Upstream requests strip account credentials, block private addresses and off-domain redirects, and limit HTML size. Both iframe sandbox and response CSP prevent the page from sharing the application's origin.

The preview supports element anchors, scroll tracking, page navigation and rendered screenshots. Capture preserves text and computed layout and embeds a bounded set of public raster assets and readable canvas content. Complex JavaScript apps, authenticated pages, some redirects and cross-origin assets can fail. Direct preview and Open website remain available; websites you control can use the optional bridge for fuller DOM capture. The bundled Nova Coffee demo supports the bridge automatically.

## External services and parity limits

- Google sign-in requires the operator's OAuth client and secret, plus an authorized redirect URI.
- Paid plans mirror the reference prices. Dodo subscription checkout, authoritative status reconciliation, signed billing webhooks, quota enforcement and renewal cancellation are implemented. Real provider transactions await setup. Refunds and tier changes are merchant-managed.
- Resend enables email verification, password reset, invitations and mention alerts. Provider setup is documented in `docs/service-setup.md`. Slack/Teams integrations, PDF export, white-label domains, analytics and public API versioning are not implemented.
- Participant mention autocomplete is implemented. Targeted in-app notifications work; email requires configuration and a verified recipient.
- Team changes use polling, not WebSocket realtime.
- The legal pages are provisional operator policies and must be reviewed before commercial use.
- The hosted Site is initially private under the platform's access policy. Client links do not bypass that policy; broader client access requires changing the audience deliberately.
- Optional browser WebMCP tools are registered when supported; this browser did not expose that API, so its runtime validation was unavailable.

## Deployment

`.openai/hosting.json` declares the registered Site, `DB` (D1) and `MEDIA` (R2). `npm run build` produces `dist/server/index.js` and `dist/client`. Generated production migrations are stored in `drizzle/`. Local SQL migrations are in `db/migrations/`. Do not rewrite applied production migrations.

Authentication is application-owned to support the independent product workflow. Hosting access policy applies in addition to application authentication.

## Verification

The automated integration/security tests cover both the original runtime and the Vercel/Turso adapter. They cover private feedback and media, cross-account isolation, client permissions and revocation, approvals, CSRF, archival access, isolated previews, workspace invitation access, removal, optional-email invitations and usage counters. Browser checks cover login, review creation, dashboard layouts, Team forms, mobile controls, screenshot capture/upload, comment persistence and Enter submission. Microphone recording and payment transactions were not exercised in this audit.

Provider accounts remain pending. The hosted Site remains private. History retention remains to be finalized; client-entry Studio badge removal is implemented. exact paid daily preview limits need operator confirmation.
