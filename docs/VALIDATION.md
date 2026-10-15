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
