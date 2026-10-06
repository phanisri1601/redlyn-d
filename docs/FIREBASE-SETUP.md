# Firebase setup for Redlyn

Project: **Redlyn** (`redlyn-cbbd3`). Plan: **Spark ($0/month)**.
Firestore default database: **asia-south1 (Mumbai)**, production rules deny direct browser access.
Console: https://console.firebase.google.com/project/redlyn-cbbd3/overview

## What is connected

The server data layer supports Firebase Firestore for accounts, sessions, projects,
workspace membership, review links, pins, replies, activity, notifications,
approvals, usage counters and optional billing/email records. Authentication
continues to use the app's hashed passwords and HttpOnly session cookies; this
setup does not use Firebase Authentication. No browser Firebase keys are needed.

All data access goes through the server's existing membership and client-link
permission checks. Each row is a Firestore document. Key lookups and scoped
queries use indexes; compound filtering and ordering happen within the selected
project/workspace data. Capacity changes, uniqueness and batches use native
Firestore transactions. This setup suits small test workspaces; large histories
will need pagination and denormalized summaries to reduce Firestore reads.

## Local development

Your untracked `.env` contains the server credentials. Run:

```
npm install
npm run dev
```

The dev server loads `.env` and uses Firestore when all three Firebase variables
are available. Without those credentials it retains the local SQLite fallback.
Existing SQLite accounts and comments are preserved but are not automatically
migrated. Create a new account for Firebase testing.

## Vercel production configuration

In **redlyn-d → Environment Variables**, configure **Production**:

| Key | Value |
| --- | --- |
| FIREBASE_PROJECT_ID | redlyn-cbbd3 |
| FIREBASE_CLIENT_EMAIL | Service-account email from your replacement JSON |
| FIREBASE_PRIVATE_KEY | Complete PEM private key from that JSON |
| UPLOADS_DISABLED | true |
| APP_ORIGIN | https://redlyn-d.vercel.app |

Keep the private key as a Secret. The local `.env` alone does not configure
Vercel. Do not publish `.env`, service-account JSON or local backup archives.
Firebase is selected when FIREBASE_PROJECT_ID is configured; SQL migrations are
skipped. Push the updated source and redeploy to apply environment changes.

## Free setup limits

Text feedback, pins, replies and approvals work without a paid storage service.
Image, screenshot and voice uploads are disabled and the comment UI explains
that limitation. Firebase Storage requires a billing-enabled Blaze plan, so it
is not enabled. Optional Google OAuth, Resend email and Dodo billing still require
their own provider credentials; their existing setup flows remain available.
Spark has usage quotas and is not unlimited.

## Verification

```
npm test
npm run build:vercel
npm run firebase:check
npm run test:firebase
```

The Firebase test suite uses disposable `redlyn_test_runs` namespaces and removes
only those namespaces afterwards. It reuses the existing access-control and
integration tests against the real Firestore SDK, plus uniqueness and rollback
checks. It never seeds fake paid subscriptions in the app's real collections.

After deployment, `/api/health` must report `ready: true`, `workspaceReady: true`
and `uploads.enabled: false`. Test signup, a review pin, refresh persistence,
client privacy, fix approval and an invitation before sharing the test link.

References:
- https://firebase.google.com/docs/admin/setup
- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
