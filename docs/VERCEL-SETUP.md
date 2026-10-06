# Deploy Redlyn from GitHub to Vercel

Your prepared project is in `/Users/phani/Downloads/Redlyn/redlyn-d`.
Copy that entire folder to Documents. The folder containing `package.json` and `vercel.json` is the project root.
The copy contains source code only. Your existing local users, hosted users, comments and uploaded files are not transferred. Create fresh test accounts after deployment.

## 1. Push your prepared folder

The target repository is https://github.com/phanisri1601/redlyn-d.
After copying the folder to Documents, open a terminal in that copied folder and run:

```sh
cd ~/Documents/redlyn-d
git init
git branch -M main
git add .
git commit -m "Prepare Redlyn for Vercel"
git remote add origin https://github.com/phanisri1601/redlyn-d.git
git push -u origin main
```

Sign in to GitHub if prompted. These commands assume a new, empty repository. If Git says the remote already contains commits, do not force-push; share the error so the existing files can be preserved.

The supplied `.gitignore` excludes `.env` files, local databases, uploaded test data, `node_modules`, build output and Vercel credentials. Keep the repository private. Do not copy the original checkout's hidden `.git` folder or `.data` folder.

## 2. Create the database

1. Sign in at https://turso.tech/.
2. Create a database named `redlyn-test`.
3. Copy its database URL and create a database authentication token.
4. Keep these values for the Vercel environment-variable form. Do not put them into a committed file or paste them into chat.

The app uses Turso's SQLite-compatible database. Vercel's temporary filesystem is not used for persistent data.

## 3. Import the GitHub repository into Vercel

1. Sign in at https://vercel.com/ with GitHub.
2. Choose **Add New → Project** and import `phanisri1601/redlyn-d`.
3. If the repository contains the project's files directly, use root directory `.`. If you uploaded a containing folder instead, choose the folder containing `package.json` and `vercel.json`.
4. Framework preset: **Other**. Node version: **22.x**.
5. The configuration file supplies the build command `npm run build:vercel` and output directory `dist/client`. Leave those settings as configured.
6. Add these environment variables for **Production**:

| Name | Value |
| --- | --- |
| `TURSO_DATABASE_URL` | Your Turso database URL, beginning with `libsql://` |
| `TURSO_AUTH_TOKEN` | Your Turso database authentication token |

7. Click **Deploy**. The build applies the database migrations automatically. A first deploy without Blob storage can show the homepage, but workspace features will display a setup message until the next step is complete.

Use a separate database and Blob store if you later enable Preview deployments for branches. Do not casually connect branch previews to your production data.

## 4. Connect private file storage

1. Open your Vercel project's **Storage** area and create/connect a **Vercel Blob** store.
2. Select **Private** access when creating the store. Do not choose a public store: internal screenshots and attachments require authenticated access.
3. Connect the store to this project's Production environment. Vercel normally adds `BLOB_READ_WRITE_TOKEN` automatically; if your store uses OIDC, ensure `BLOB_STORE_ID` is configured instead.
4. Open **Settings → Environment Variables** and add `APP_ORIGIN` with your final URL, such as `https://your-project.vercel.app` (no trailing slash). Use your actual assigned URL.
5. Redeploy the latest deployment so the function receives the new settings.

The backend reads private files only after checking account or client-review permissions. Blob credentials stay on the server.

## 5. Check the test website

1. Open `https://YOUR-ACTUAL-DOMAIN/api/health`. It should return `{"ready":true}`.
2. Open `/signup` and create a new test account.
3. Create a demo review, leave a comment and attach a small image.
4. Refresh the page and confirm the comment/image remain.
5. Create a client review link and open it in an incognito window. Check that internal notes are hidden.
6. Move a public comment to **In review**, confirm it using the client link, then approve the page.

Vercel deployment protection can require Vercel authentication before the app opens. Adjust protection only if you intentionally want external testers to access the deployment; this code preparation does not change the sharing policy of your existing private ChatGPT Site.

## Optional: invite extra people for testing

The default Free plan allows one total member. To allow up to five total members temporarily, add both settings in Vercel and redeploy:

```text
TEST_TEAM_MEMBER_LIMIT=5
TEST_TEAM_UNTIL=2026-11-04T18:29:59Z
```

That deadline is 4 November 2026 at 11:59:59 PM India time. Existing teammates are not deleted when it expires. This does not grant a paid subscription.

## Optional service accounts

Email/password login, feedback, client links and approvals work with the database and private storage. These additional features require your own provider accounts:

- Google login: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`. Use `https://YOUR-ACTUAL-DOMAIN/api/auth/google/callback` as the authorized redirect URI.
- Invitation/reset/verification/mention email: `RESEND_API_KEY`, `EMAIL_FROM`, and a verified sending domain.
- Paid subscriptions: Dodo API key, product IDs and webhook signing key. See `docs/service-setup.md`. Configure webhook delivery to your actual `/api/billing/webhook` URL and avoid deployment protection that blocks provider requests if you enable billing.

## Limits and verification

The Vercel adapter caps each uploaded file at 4 MiB, leaving room below the platform's 4.5 MB request limit. Files are uploaded one at a time. Long voice notes or large screenshots may exceed this cap and need smaller captures. Larger uploads require a future authenticated direct-upload flow.

The deployment adapter, routing, database migrations, atomic batches, HTTPS sessions, private attachment access and client approvals are covered by automated tests. Remote Turso/Blob credentials and a real Vercel deployment cannot be verified until you connect your accounts. Existing feature-parity gaps remain documented in the README and comparison report; deployment preparation does not add Google/payment/email credentials or guarantee exact reference parity.

Reference documentation:
- https://vercel.com/docs/functions/functions-api-reference
- https://vercel.com/docs/vercel-blob
- https://docs.turso.tech/sdk/ts/reference
