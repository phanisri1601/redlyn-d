# Next.js migration and deployment

Updated source: `/Users/phani/Downloads/Redlyn/redlyn-d`.

1. Copy this folder’s updated source into your GitHub checkout, preserving its `.git` folder, then commit and push. When copying over an older checkout, also delete the retired `api/index.js` and `public/index.html` there; copying files alone does not remove them. Do not copy `.env`, Firebase key JSON, `.data`, backups, `node_modules`, `.next` or `dist`.
2. In Vercel project Settings → Build and Deployment, choose **Next.js**. Remove any old Output Directory override (`dist/client`). Leave Output Directory at the framework default. Build Command is `npm run build:vercel`; Install Command is `npm install`.
3. Keep the existing Production Firebase environment variables and `UPLOADS_DISABLED=true`. Keep `APP_ORIGIN=https://redlyn-d.vercel.app`.
4. Redeploy the new commit. No Firebase data migration is needed. The existing Firestore collections, user accounts and feedback remain in use.
5. Check `/api/health`, log in, open a review, add a pin, post feedback, and check the client link.

## Local commands

`npm install`

`npm run dev` — Next.js development server, reads `.env`.

`npm run build` then `npm start` — production build and server.

`npm test` — regression suite. `npm run test:firebase` — real Firestore tests using disposable test collections, requiring local credentials.

## What changed

Next.js App Router serves public HTML from the build and handles API/preview requests through Node.js Route Handlers. Interactive dashboard/review screens retain the existing browser UI engine during this incremental migration. They are not rewritten into React components yet.

The backend batches independent comment/attachment reads concurrently (maximum eight threads at a time), and fetches dashboard summaries concurrently. Disabled screenshot uploads now skip expensive capture work on pin clicks. The capture library loads only when needed. Polling pauses in hidden tabs, prevents overlapping requests, and runs every 15 seconds; explicit saves refresh immediately. Browser assets have versioned names and immutable caching. Vercel functions run in Mumbai near the Mumbai Firestore database.

These changes remove identified sources of delay. Next.js alone does not guarantee a speed increase: external website previews, database size, networks and server cold starts still matter. Measure the deployed version after redeployment; local timings do not establish the live speed improvement.
