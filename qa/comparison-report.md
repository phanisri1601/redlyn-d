# Redlyn comparison and QA — October 5, 2026

The original public site and the user-provided signed-in reference were inspected. Reference account data was not modified. Functional testing used a separate local QA account. The attached blueprint was treated as reference material, not as permission to perform external actions.

## Comparison and fixes

| Area | Observed reference behavior | Rebuild result |
| --- | --- | --- |
| Public site | Hero, product demo, feature sections, four plans, comparison, FAQs, theme | Main sections and links implemented; static demo has Team/Client switching. Pixel-perfect animation parity is not claimed. |
| Dashboard | Greeting, inline website link, status filters, grid/list, latest activity | Added these controls, counts, layout persistence and screenshot covers. |
| Archive | Dedicated navigation | Added dedicated archived review list and restoration; client access ends while archived. |
| Team | Workspace-wide access; optional email invitation | Added workspace-wide membership, optional-email links, roles, expiry/revocation and inherited current/future review access. |
| Workspaces/settings | Switch workspace; rename workspace | Added switching, scoped review creation, renaming and mobile switcher. |
| Usage | Sites/members, comments and views today/month | Added genuine workspace counts. UTC periods and isolated preview-load semantics are disclosed. Website/member and daily-preview caps are enforced; paid caps beyond the observed Free cap need operator confirmation. |
| Review devices | Desktop fit, tablet/mobile groups, many presets | Added fit-to-window, group controls, 22 presets and custom dimensions. |
| Review preview | No-install website rendering and anchored screenshots | Added isolated public HTTPS proxy, element/scroll tracking, rendered capture and same-domain navigation. External media fidelity remains limited. |
| Comments | Public/internal notes, threads, mentions, snapshots, review states | Implemented these core workflows; added mention autocomplete and fixed Enter submission and clipped dialog actions. |
| Approval | Page approval and changes-requested state | Added idempotent approvals, stale sign-off invalidation on public changes, dashboard summaries and approval indicator. |
| Sharing | Team/client access separation | Protected app sessions and client tokens; independent comment/approval permissions, password, optional email, expiry and revoke. Hosted audience restriction still applies. |
| Mobile | Responsive public/review screens | Checked at 393 × 852. Fixed workspace switcher visibility and comments drawer placement. Dashboard has no page-width overflow. |

## Verification

- `npm test`: 27/27 passing integration/security tests.
- `npm run build`: successful frontend and Cloudflare Worker build.
- Local browser: existing test login; Team optional-email form; dashboard; usage; real public Redlyn page inside isolated preview; automatic screenshot; saved public comment/media; Enter-saved internal note; mobile dashboard and comments drawer.
- Earlier browser checks: demo/client entry, public/private feedback separation, link controls, screenshot attachments and public desktop/mobile pages.
- Reference inspection: public homepage/mobile, signed-in dashboard/review, Team invitation dialog, Settings and Usage. Reference paid checkout and account mutations were not exercised. Archive reference navigation returned stale page content, so its detailed layout was not verified.
- New production migrations add tables/indexes without deleting existing reviews or users. Local QA accounts and database are excluded from deployment.

## Remaining differences and dependencies

This is not verified as an exact feature-for-feature or pixel-perfect clone.

1. Google sign-in needs operator OAuth credentials. Email/password sign-in works.
2. Dodo checkout, provider-verified entitlements, signed event handling and period-end cancellation are implemented and tested with mocked provider responses. Live payment and cancellation transactions await account setup. Tier changes and refunds are merchant-managed. Private hosting blocks direct provider webhooks; owner visits to Usage & plan reconcile status. Paid entitlements must be refreshed hourly.
3. The hosted Site retains its private audience. Client review links cannot bypass the platform's access gate; anonymous external client access is not enabled.
4. Isolated proxy screenshots include up to ten visible public raster images, simple image backgrounds and readable canvas content. Video, embedded frames and some fonts are still omitted. Authenticated/complex pages and off-domain redirects may require direct preview or a bridge on a controlled website. Capture is rendered DOM output, not a remote browser screenshot service.
5. Mention/assignment notifications, optional invitation emails, password reset and verification are implemented. Actual delivery awaits Resend account/domain configuration; in-app alerts work independently. Updates poll every seven seconds.
6. Microphone recording permissions and real payment transactions were not tested in this audit. Policy pages remain provisional. Homepage demonstration animation, detailed reference filters/menus and every possible third-party website have not been exhaustively matched.

## Evidence

Updated local QA screenshots are in `screenshots/`: `dashboard-final.png`, `team-final.png`, `usage-final.png`, `capture-fixed.png`, `review-saved.png`, `dashboard-mobile-final.png` and `mobile-comments-final.png`. These show the local rebuild and disposable test data, not production account data.

## October 5 implementation and validation

- Added single-use hashed reset/verification tokens, expiring links and session revocation after reset. Provider failures do not produce a fake success or leave a usable new token.
- Added targeted in-app mentions and assignments; notification reads re-check membership. Verified recipients can receive privacy-preserving email alerts. Optional email invitation failures retain the manual link.
- Added owner-only subscription checkout, authoritative private-site reconciliation, expiry/staleness handling, signed webhook verification, idempotency/event ordering and renewal cancellation. Repeated checkout requests are throttled.
- Added active-site and unique-member caps, daily preview caps and safe handling of existing over-limit reviews. Exact paid view caps, advertised history retention and Studio badge removal remain unverified/incomplete.
- Added account recovery pages and a server-configuration status/setup screen. No live credentials were present and no real email or payment was sent.
- Browser checked login, account settings and usage. The first browser session stalled while opening the newly created local review; a fresh session was used for continued checks. Capture asset backend is tested; new external-image capture rendering needs browser verification before claiming full fidelity.
- Account instructions: `docs/service-setup.md`. The Site audience remains private at the user's explicit request.

## Temporary team testing access — October 5, 2026

Enabled a server-configured allowance of five total Free-workspace members through November 4, 2026, 23:59 India time. Both invite creation and acceptance use the same effective cap. Two additional integration tests cover successful membership, maximum count, invalid settings, expiry and preservation of existing members. The Site remains private and billing is unchanged.


## Review layout and direct pinning — 5 October 2026

Updated review header and left-side comments panel to follow the supplied reference screenshot. Comment mode is active by default for reviewers with comment permission. A circular red plus follows the pointer; clicking the preview opens the composer directly. Saved pins retain their comment numbers. Rows include screenshot thumbnails, element text/tag, viewport width and assignee when available.

Verified locally using a separate QA account: direct-click opens screenshot composer; posting persists feedback and metadata; subsequent click creates another draft without mode activation; Cancel restores Comment mode; Browse follows page anchors without creating feedback; Alt click passes through, and releasing Alt restores pinning. Mobile Comments drawer opens/closes, and Fit adjusts across390/768/1440 viewports. No browser errors observed. Existing27 automated tests pass and frontend/Worker build passes. Independent design evaluation passed after fixing mobile toolbar and Fit resize. Different-provider evaluator unavailable; independent evaluator used the available model.

Evidence: screenshots/review-direct-pin-desktop.png, screenshots/review-plus-pointer-final.png, screenshots/review-comment-composer.png, screenshots/review-direct-pin-mobile.png, screenshots/review-mobile-comments.png, screenshots/review-fit-tablet.png. UI changes preserve existing permission checks; backend view-only restrictions remain covered by tests. This verifies the changed workflow, not every feature of the original service.


## Anchored new-comment composer — 6 October 2026

New pin comments use a nonmodal contextual card beside the clicked spot, with a provisional plus marker and no full-screen backdrop. Desktop card flips at edges. Narrow layouts place it above/below with a bounded scrollable body and visible posting footer. Existing media, priority, visibility and permission behavior is retained.

Verified locally on1440x1000 and390x844: click opens adjacent card; native dialog modal state is false; desktop edge flips left withinviewport; mobile card preserves24px gap frompin; posting persists comment and screenshot; Cancel/Escape remove draft and rearmComment; Escape works after fileupload changesfocus; screenshotremoval and filepicker selection work; drafttext survivesviewportresize. No browsererrors observed. Build passes and27 existing tests pass. Independent design evaluation passed. Actual microphone recording was not exercised in this iteration.

Evidence: screenshots/anchored-comment-desktop.png, screenshots/anchored-comment-edge.png, screenshots/anchored-comment-mobile-final.png. Earlier mobile captures document intermediate QA states; finalmobile image supersedes them.


## Review toolbar refinement — 6 October 2026

Replaced Unicode device/control symbols with consistent outlined SVGs. The compact header follows supplied reference: back/logo/sidebar toggle, projectname+Home/path disclosure, laptop/tablet/phone+Fit, Comment/Browse, greenApprove, notifications, purpleTeamview, theme, more and redShare. URL/preview/shortcut controls remain reachable through Home/More. Mobile Share/logo have accessiblelabels evenwhen text ishidden.

Verified locally: tablet changes to820px andphone393px with correct active state; desktopFit works; sidebarcollapse expands preview1088->1408px andrestores; Home reveals URLcontrols, More exposesextras, shortcuts opens modal, theme toggles, notifications link reaches existingNotifications screen, mobileComments drawer opens. Anchoredcomposer still opens nonmodally next topin after toolbarupdate. No browsererrors observed; build passes. Independent design review passed desktop1440, tablet768 andphone390 screenshots. Backend unchanged; prior27-test pass retained.

Evidence: screenshots/toolbar-desktop-final.png, screenshots/toolbar-tablet.png, screenshots/toolbar-mobile.png.

## Feature parity follow-up — 6 October 2026

Re-read the live reference homepage and compared its advertised features with the implementation. This is not an exhaustive signed-in parity certification: the previously shared Chrome reference session was no longer discoverable by the browser testing tool.

Completed in this follow-up:
- New-pin composer accepts pasted PNG/JPEG/WebP images, appends rather than replaces attachments, rejects unsupported/oversized clipboard images, and permits image-only comments.
- Reply clipboard attachments belong to the current reply form instead of a global list, preventing an image from one thread from being posted to another. Image-only replies are supported.
- Client entry badge follows server-side workspace entitlement: hidden for an active Studio subscription and restored after expiry. Automated tests also retain archived-link enforcement. No real paid account was granted or simulated.
- All 28 backend tests pass; frontend/Worker build succeeds.

Still incomplete or requiring setup/verification:
- Google OAuth, real payment processing and email delivery need operator accounts/secrets.
- Site remains private at the owner's request; anonymous external client access is gated by the hosting platform.
- Free 30-day history versus unlimited paid history is advertised but not enforced. Existing feedback is preserved; no data was deleted or expired as part of this audit.
- Exact higher Agency/Studio preview quotas are not published on the reference homepage; existing operator-configurable limits remain pending confirmation.
- Dynamic-site screenshot fidelity (video, third-party frames, complex animation/font cases), all signed-in reference menus and real microphone capture remain outside a verified parity claim.

Browser verification for this follow-up used the existing disposable local QA account: a synthetic clipboard PNG was pasted into a reply and saved with no typed text; the persisted image loaded successfully. A new pin was placed using the mouse on the rendered reference preview. Its nonmodal anchored composer accepted a pasted PNG, permitted an image-only submission, closed after posting, and displayed both the automatic screenshot and pasted image as loaded attachments. Test data was confined to the QA project. Clipboard delivery was synthesized for automation; native OS clipboard permissions were not exercised.
