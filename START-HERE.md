# Your GitHub / Vercel copy

Copy this entire `redlyn-d` folder from Downloads to Documents.
The files `package.json` and `vercel.json` must stay together at the project root.

1. Copy this folder to `~/Documents/redlyn-d`.
2. Follow [the GitHub and Vercel steps](docs/VERCEL-SETUP.md).
3. Push to `https://github.com/phanisri1601/redlyn-d.git`.
4. Import that repository into Vercel using Framework **Other**, Node **22.x**.
5. Connect your Turso database and **private** Vercel Blob store, then redeploy.

This folder includes the source code and deployment configuration. It contains no existing Git history, local account database, user uploads or configured provider credentials. Your existing hosted data is not copied automatically.

Preparation checks: 35 automated tests passed, build succeeded, and the production dependency audit reported no known vulnerabilities. Live Vercel/Turso/Blob connectivity still needs your service accounts. See the deployment guide for environment variables and the testing checklist.
