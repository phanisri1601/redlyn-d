# Connect your service accounts

The Site stays private. Google OAuth, email delivery and payment code are implemented, but provider accounts and live credentials have not been supplied or tested. You own these accounts and complete signup, consent and merchant verification yourself.

## Google sign-in

1. In [Google Cloud](https://console.cloud.google.com/), create or select a project and configure Google Auth Platform branding and audience. Add your Google account as a test user while testing.
2. Create an OAuth client of type **Web application**. Authorized JavaScript origin:
   `https://redlyn-rebuild-phani.phanisri906220.chatgpt.site`
3. Register this exact authorized redirect URI:
   `https://redlyn-rebuild-phani.phanisri906220.chatgpt.site/api/auth/google/callback`
4. Configure `GOOGLE_CLIENT_ID`, secret `GOOGLE_CLIENT_SECRET` and `GOOGLE_REDIRECT_URI` in server settings. Test in a browser allowed to open this private Site. Existing password accounts keep password sign-in; automatic Google linking to an existing email is blocked.

Reference: [Google web-server OAuth instructions](https://developers.google.com/identity/protocols/oauth2/web-server).

## Email delivery

1. Create your own [Resend account](https://resend.com/signup).
2. In Domains, add a domain or subdomain you own. Add the DNS records Resend provides at your domain's DNS provider, then verify it.
3. Create a sending API key. Configure secret `RESEND_API_KEY` and `EMAIL_FROM`, for example `Your workspace <notifications@YOUR-DOMAIN>`.
4. Set `APP_ORIGIN` to the Site origin above. In app Settings, send a verification email to yourself. Test reset, invitation and mention delivery using disposable accounts. Reset links expire in 30 minutes; verification links in 24 hours; both work once.

A `chatgpt.site` hostname is not an email domain you own. Resend requires domain ownership for production sending. References: [verified domains](https://resend.com/docs/dashboard/domains/introduction), [send-email API](https://resend.com/docs/api-reference/emails/send-email).

## Payments

1. Create your own [Dodo Payments account](https://app.dodopayments.com) and complete merchant onboarding.
2. In test mode, create three monthly recurring products: Starter ₹499, Agency ₹1,499, Studio ₹3,499. Confirm interval, INR currency, tax and displayed checkout price.
3. Configure secret `DODO_PAYMENTS_API_KEY`, `DODO_ENVIRONMENT=test` and the three test product IDs: `DODO_STARTER_PRODUCT_ID`, `DODO_AGENCY_PRODUCT_ID`, `DODO_STUDIO_PRODUCT_ID`.
4. As the app workspace owner, choose a plan in Usage & plan. Complete checkout yourself with Dodo's documented test payment method, then return to Usage & plan. The server grants paid access only after verifying matching checkout, payment and subscription records with Dodo.
5. Test cancellation: access continues until the paid period ends. On-hold, expired or stale unverified subscriptions use Free limits. Existing reviews remain stored when caps decrease.
6. After testing, configure a live key and live product IDs, set `DODO_ENVIRONMENT=live`, redeploy, and verify checkout before accepting customers. Test and live resources are separate.

The private Site's access gate blocks ordinary public Dodo webhook deliveries. This implementation checks billing with outbound Dodo API requests when the owner opens Usage & plan. Stored paid entitlements expire at the verified period end and must be refreshed at least hourly; until then stale entitlements use Free limits. Checkout never grants access based on a return URL alone.

A signed webhook handler at `/api/billing/webhook` supports a future authorized relay. It uses secret `DODO_PAYMENTS_WEBHOOK_KEY` and checks signatures, replay timestamps and event ordering. Do not share the Site platform service bearer with Dodo or change privacy to work around the access gate. An unattended relay needs separately authorized configuration.

Reference: [Dodo webhooks](https://docs.dodopayments.com/developer-resources/webhooks). Refunds and subscription tier changes are currently merchant-managed in Dodo; the app supports checkout and cancellation and prevents a second active subscription. Finalize your merchant policy pages before commercial use.

## Plan settings and remaining parity

Website/member caps match the inspected cards: Free 1/1, Starter 5/2, Agency 20/5, Studio unlimited/unlimited. The observed Free daily preview cap is 300. Exact paid daily caps were unavailable in the reference account; defaults stay 300 until you configure `STARTER_DAILY_VIEWS`, `AGENCY_DAILY_VIEWS`, `STUDIO_DAILY_VIEWS`. `FREE_DAILY_VIEWS` is also configurable.

History-retention promises and Studio badge removal remain to be finalized. Capture includes up to ten visible public raster images, simple backgrounds and readable canvas content, but video, embedded pages, fonts and complex apps can still differ. Real microphone recording and provider transactions were not tested. The QA report records these limits; this is not certified exact parity.

## Private access and safe configuration

Client and teammate app links do not grant Site platform access. Keep the Site private as requested; allow intended visitors through Site sharing where supported before giving them app links.

Use native Sites runtime settings; mark API keys and client secrets secret. Never add values to source or `.openai/hosting.json`. `.env.example` lists names only. For help connecting credentials, save them in the ignored local `.env.production` file and tell me it is ready; do not paste passwords or keys in chat. Deployment uses native runtime settings, not the local file.

Once you create the accounts, I can connect their server settings, redeploy and test the real integrations with you. Start with the email domain and Resend so password recovery can be activated first.

## Temporary team testing

At your request, this private test Site allows five total members per Free workspace (owner plus four teammates) until November 4, 2026, 11:59 p.m. India time. This is an explicit server-side test allowance, not a paid subscription. The `TEST_TEAM_MEMBER_LIMIT` and `TEST_TEAM_UNTIL` runtime settings control it. Normal limits return after expiry or removal of those settings. Existing accounts and membership records are preserved; expiry blocks additional invitations and acceptance above the normal cap. Website, preview and billing limits are unchanged.
