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

