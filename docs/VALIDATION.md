# Validation record

## Firebase integration

- Strict TypeScript and production bundle: passed.
- Six application/data normalization tests: passed.
- Five Firestore emulator security tests: passed with exit code 0, against isolated `demo-aisle` only.
- Verified owner can write/read own state.
- Second user cannot read/write another UID, even with the document path.
- Anonymous and unverified users cannot access shopping state.
- Invalid IDs, stock overflow, negative/fractional quantities, arbitrary fields and forged timestamps are rejected.
- Listing user records and manufacturing a paid order are rejected.

The first emulator run passed all assertions but the CLI exited with an update-notifier permission error on the host's config directory. Repeating with an isolated config directory and update notifications disabled completed successfully. Portable Temurin JRE 21 was downloaded from the official Adoptium distribution and checked against the published SHA-256, only under ignored `.capture-state/`; no system Java installation was changed.

Not yet verified: actual Firebase production rules publication, authorized-domain configuration, live Google popup, email registration/delivery/reset, cross-device persistence against the actual project, GitHub repository creation and live deployment. These require the project owner's console/terminal actions and subsequent live checks. No real user account was created and no verification/reset mail was sent by the agent during testing.
# iyzico Sandbox adapter (not yet tested with merchant credentials)

Twelve Node tests pass, including six payment/security tests: server catalog parity,
malformed quantities/prices, encrypted ticket tamper/expiry/account ownership,
Firebase RSA JWT claims and signatures, sandbox-only request signing, provider
signature/amount/basket matching, CORS/method controls and untrusted callbacks.
The strict TypeScript + Vite production build passes. No live iyzico credentials
were used. Vercel packaging, hosted payment success/decline and callback accessibility
still require deployment checks. This implementation displays an ephemeral sandbox
receipt; it does not persist a paid order or trigger fulfilment. Existing Firestore
rules are unchanged. See PAYMENT-SANDBOX.md for deployment steps and limits.


## Account page

Signed-in account navigation now opens hash-routed full-page sections for saved
finds, browser-local demo orders and existing account/verification controls. Guests
retain the sign-in modal. Shared order rendering preserves cancel/buy-again behavior.
The production build and isolated React render checks (populated/empty favorites,
section anchors, Pages asset prefix, no dialog) pass. Responsive CSS is included;
live browser layout and back-navigation still need user verification after deployment.


## Paid cart quantities and shopping lists

14 application tests and 7 Firestore emulator tests pass. The strict production build passes.
The paid USD session now returns its catalog-validated original lines inside the encrypted
ticket, and the browser subtracts only those quantities once per payment reference in the
current app session. TRY diagnostics cannot invoke the paid-bag completion callback.
Lists are separate owner-only Firestore documents with bounded names/product sets and
server timestamps; tests cover permitted owner operations and rejected cross-user queries,
updates/deletes, unverified writes and malformed documents. Updated firestore.rules must
be published before list use. Live UI/persistence/payment testing remains after deployment.
Initial emulator launch lacked network permission; after the permission grant the cached
CLI ran all seven tests successfully against demo-aisle, without touching production data.


## Sign-in landing correction

Successful sign-in from the account modal closes the modal, resets catalog filters
and navigates to the top of the home page instead of opening the account page.
Explicit account navigation and refreshing an already-open account page remain
separate. Production build passes; verify Google/email sign-in after publication.


## Checkout and demo-tools separation

Normal checkout now has one USD provider flow; no TRY selector or offline order button.
The footer Demo tools dialog contains a separate fixed 1 TL provider diagnostic and
browser-only offline simulations. Offline orders use a copy of the bag without clearing
it. Provider result authority remains server-side; receipt/currency checks are preserved.
Local browser UI checks covered delivery to review, clean checkout layout, separate
diagnostic/offline tools, declined simulation and successful retry. No live merchant
request or real account was used in these UI checks. The prior 15 tests pass; production
build passes. New live sandbox payment and mobile visual checks remain after publication.
Preview screenshot: outputs/aisle-checkout-clean.png in the chat output directory.



## Pip AI integration

22 automated tests and production build pass. New tests cover catalog parity, bounded/redacted context, strict configuration, durable quotas, output ID/budget validation, provider failures and route authentication/origins. Local guest browser view and sign-in handoff checked. Provider tests use injected fixtures: live OpenAI and Upstash validation remains pending user credentials. See PIP-SETUP.md.


### Zero-budget provider change

User requires a free exam implementation. Replaced OpenAI with fixed Gemini 3.5 Flash-Lite, server-only GEMINI_API_KEY; no paid fallback. Updated privacy disclosure for Google Free Tier product improvement. 23 tests and production build pass, including explicit provider 429/no-fallback and safety/truncation handling. Live Gemini/Redis calls remain pending user configuration of an unbilled Free Tier Google project and Free Redis.
