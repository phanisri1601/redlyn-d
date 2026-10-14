# Next.js migration and deployment

Updated source: `/Users/phani/Downloads/Redlyn/redlyn-d`.

1. Copy this folder’s updated source into your GitHub checkout, preserving its `.git` folder, then commit and push. When copying over an older checkout, also delete the retired `api/index.js` and `public/index.html` there; copying files alone does not remove them. Do not copy `.env`, Firebase key JSON, `.data`, backups, `node_modules`, `.next` or `dist`.
2. In Vercel project Settings → Build and Deployment, choose **Next.js**. Remove any old Output Directory override (`dist/client`). The committed `vercel.json` explicitly sets Output Directory to `.next` so it overrides an old `dist/client` project setting. Build Command is `npm run build:vercel`; Install Command is `npm install`.
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

## Device preview correction

Mobile/tablet frames preserve the selected native viewport, then scale their displayed footprint to fit the available canvas in both dimensions. Sidebar/window size changes update that scale. The comment composer converts element coordinates through the same scale so its draft marker stays at the clicked point. Checked 393 × 852 phone and 820 × 1180 tablet viewports, including a 390px-wide review window; no horizontal preview overflow.

## Review testing and deletion

This test deployment defaults to six active reviews on Free (one existing review plus five more). Set `TEST_REVIEW_LIMIT=0` in Vercel and redeploy to return to the normal Free limit; no existing data is deleted. A valid override can range from 2 to 20. Paid subscription limits are unchanged. Usage & plan shows the testing allowance.

Open a review’s management page via its dashboard ⋯ button, then choose Delete review. Only an owner/admin can delete. Confirmation deletes review records, comments, pins, replies, attachment records, links, reviewer sessions, invitations and preview tickets. Any legacy uploaded blobs are no longer accessible through the app; physical blob cleanup is separate (uploads are disabled in this deployment).

Workspace navigation keeps the current page engine loaded. Settings and Usage no longer fetch all review summaries before rendering. Account/workspace responses are cached in memory for 30 seconds and invalidated by mutations or browser history navigation. Usage queries run concurrently.

## Loading and navigation refinement

The sidebar stays visible during navigation, with a page-specific skeleton in the content area; the same skeleton is server-rendered on a fresh workspace visit. The old full-screen “Loading your workspace…” message is removed. `/api/bootstrap` combines authenticated account details and accessible workspace names/plans, reducing startup requests. Usage/review summaries have short, memory-only caches invalidated by mutations. Secondary dashboard activity loads independently. Navigating elsewhere aborts obsolete page GET requests so an old response cannot overwrite the new page.

## Website rendering and clarity

Reviews open in Live website view by default, which loads the original website rather than a copied HTML document. This preserves the site’s origin, fonts and script behavior when the site permits embedding. Pin placement remains available; install the optional bridge on a website you control for element anchors and scroll tracking in live view. Enhanced preview remains selectable for sites needing injected review tools. Some websites prevent framing; use Enhanced or Open website in those cases. Enhanced preview can differ from the original for sites requiring same-origin scripts/storage.

Default zoom is now Fit width: phone/tablet previews stay at 100% when their width fits, with the canvas scrollable vertically. 100% provides native CSS pixels, and Fit screen remains available to show the whole selected device. The selected iframe dimensions stay unchanged across zoom modes. This does not emulate mobile hardware or a mobile user agent.

Reviews check the website’s framing headers when creating the preview session. Sites that explicitly disallow embedding (for example, IM Solutions with X-Frame-Options: SAMEORIGIN) start in Enhanced mode automatically. Unrestricted sites retain Live website mode. If the header check is unavailable, users can still select Enhanced manually. Enhanced keeps the isolated sandbox and public-domain checks.

October 2026 UI improvements: signup only shows Google after the server confirms it is configured. Homepage sample feedback stays in browser memory and never creates real reviews. Preview loading and recovery appear above the canvas. Device, zoom and sidebar controls preserve the loaded iframe; only page navigation, reload or rendering-mode changes load a new document. Framing hints are cached for five minutes per server instance (documents and access checks are not cached). Attachment URLs are reused only within the current screen and cleared on route changes. Voice and screenshots remain disabled in the current text-only setup.
