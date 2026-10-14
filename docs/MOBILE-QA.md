# Mobile responsiveness audit

Checked the local production build with disposable sample data at 320 × 844, 390 × 844 and 768 × 844 pixels. No real customer accounts or reviews were modified.

All 90 page/width checks rendered successfully and had document width equal to viewport width after the fixes.

Routes checked:

- Home, pricing, features, comparison, privacy, terms and refund.
- Login, signup, forgot password, reset password and email verification.
- Dashboard, archive, workspace team, usage/plan, settings, service setup and notifications.
- Project overview, feedback, review links, project team, activity and project settings.
- Client/review entry screens, project invitation, workspace invitation and team review.

Visual checks included project settings with a long title, delete confirmation, an expanded review comment thread and an anchored pin composer. The composer also stayed inside a simulated 420px-high visual viewport when the keyboard opened; this simulation does not replace testing on physical iOS/Android devices.

Fixes: narrow-phone pricing/steps stack, project action rows wrap below titles, tablet dashboard gutters align, long links/names wrap, tables and tabs scroll inside their own containers, phone fields use 16px text, dialogs fit the viewport, and the comment composer follows visual viewport resize/scroll events.

Wide tables and navigation tabs intentionally scroll horizontally inside their containers. Embedded third-party websites retain their own responsive behavior.

Validation: production build passed; 46 automated tests passed, 2 Firebase-specific tests skipped in the normal test command.

## Mobile website scrolling fix

Mobile reviews now start in Browse mode. Fit selects the phone/tablet feedback group based on the review window width. The connected bridge handles vertical touch swipes, routes scrolling through nested panels before the page, preserves horizontal gestures, and suppresses accidental clicks immediately after a swipe. This handler only runs inside a connected review iframe.

Verified a simulated mobile touch swipe on the actual fetched IM Solutions document: page scroll advanced from 0 to 300px. Gesture tests cover vertical scrolling, horizontal gesture preservation and nested scroll boundaries. Production build passed; 48 normal tests passed, 2 Firebase-specific tests skipped. Physical phone verification remains recommended.

## Mobile input follow-up

Mobile Comment mode now handles pointer taps in the review overlay and requests the selected element from the isolated bridge. Swipe/wheel movements are forwarded to the reviewed page; Browse removes the overlay. Native-size previews avoid an unnecessary CSS transform.

End-to-end checks on a disposable IM Solutions review: a real pointer tap opened the composer; posting saved a test comment and closed the composer; Comment-mode scrolling advanced the page 300px; Browse allowed the mobile menu to open and About Us to load in the preview. No customer review was modified. The actual signed-in Chrome tab was reloaded, but its emulated-page UI was not exposed to the computer-use tool for direct tap verification.

## Full page scroll range

Connected mobile Enhanced previews now synchronize the review canvas with the full document height instead of limiting canvas movement to the iframe's viewport height. The iframe stays sticky while the outer scroll position drives the website's scroll position. Native page scrolling also updates the canvas. Bottom-edge handling preserves the extra outer movement needed to expose the footer when the native device viewport is taller than the visible review area.

IM Solutions check at 440 × 956 with a 393 × 852 phone profile reached outer scroll 11,892px (the full outer range) and inner scroll 11,672px (document 12,524px minus viewport 852px). Returning to the top reset both to 0. Production build passed; 49 tests passed, 2 Firebase-specific tests skipped.

## Hamburger and menu links

Mobile navigation controls now run their website handlers in Comment mode instead of being mistaken for a pin. Verified with pointer clicks on IM Solutions after scrolling: hamburger opens its menu without a composer, and About Us navigates in the connected preview. Browse mode continues to use the website's native controls.

## Browse tap forwarding

Connected mobile Enhanced previews forward Browse taps from the review's input layer to the website element at the corresponding coordinates. This avoids relying on native hit testing of a sticky isolated iframe. Browse gestures scroll the full canvas; Comment gestures retain pin selection. Nonce and parent-source checks protect activation messages.

Verified with real pointer taps while Browse remained selected: hamburger menu opens, About Us loads in the preview, no composer appears, and a wheel gesture advances scroll 700px. Production build and 49 tests passed.

## Generic native Browse interaction

The simulated Browse-click overlay has been removed. Browse now leaves native pointer input to the actual webpage, including focus, typing, checkboxes, widget handlers and navigation. Connected mobile frames use a fixed clipped viewport rather than a transformed/sticky input target; full-document canvas scrolling and footer reach remain supported. Native Browse touch/wheel handling is left to the website/browser. Navigation interception runs in the bubble phase and respects handlers that already prevent default. Menu exceptions in Comment mode use semantic selectors rather than an IM Solutions-specific ID.

Public same-origin classic script and stylesheet tags are adapted for loading from an opaque preview. CDN integrity and module tags are retained. A body/document ResizeObserver reports changing page height (for example, accordions and lazy content). The opaque sandbox and public-HTTPS checks remain unchanged.

Browser validation covered IM Solutions navigation and Bootstrap's mobile offcanvas menu, accordion toggling, native email input typing and checkbox selection. These controls were exercised with pointer/keyboard input in Browse; the sample form was not submitted. This is compatibility coverage, not a guarantee for every third-party website: login-dependent pages, module/API origin requirements and blocked embedding can still require a direct view or installed bridge on a site the owner controls. Build passed; 51 tests passed and 2 Firebase-specific tests skipped.

## Single native mobile viewport (supersedes mirrored scrolling above)

The shared review engine now sizes the mobile iframe to the actual visible canvas height, preserving the selected device width and responsive breakpoints. It removes the full-document outer scroll mirror and fixed/clipped wrapper. Browse uses native iframe input and scrolling; Comment retains the protected pin-picking bridge and gesture scrolling. No website-specific condition is used for this layout.

At 440 × 956, the 393px phone preview uses a 632px visible iframe, with zero outer canvas scroll range. Native keyboard scrolling after focusing IM Solutions reached its footer at inner scroll 11,892px (document height 12,524px), with the footer visible. A real pointer click opened Bootstrap's mobile offcanvas menu in Browse. A real pointer click in Comment opened the anchored composer, and submitting text saved a disposable QA comment. Earlier multi-site native widget checks remain recorded above; physical phone touch testing has not been performed. The new visible-height unit test covers scaled previews, desktop preservation and reduced available height. Production build passed; 52 tests passed, 2 Firebase integration tests skipped.
