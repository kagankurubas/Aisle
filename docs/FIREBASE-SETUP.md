# Firebase setup (replacement for Supabase)

The application now uses Firebase Authentication and Cloud Firestore instead of Supabase. The old SDK and adapter have been removed. The applicant supplied the public web configuration for `aisle-4f23e`, retained only in ignored `.env.local`; no admin credential was supplied or required.

1. Create an Aisle project at https://console.firebase.google.com/ using the no-cost Spark plan. Analytics is optional and unnecessary here. Do not enable billing or upgrade to Blaze for this step.
2. Register a Web app. Keep the browser config locally; never provide a service-account JSON or private key to the frontend.
3. Under Authentication > Sign-in method, enable Google and select the support email. Add the eventual deployed hostname to Authorized domains.
4. Create Cloud Firestore in production mode, choosing a region appropriate to the intended users. Do not enable test-mode public access. The project's default deny rules stay in place until the application-specific rules have been prepared and verified.
5. Account data will be scoped by authenticated UID. The client may access its own cart and favorites only. Payment status and verified orders must be written by a trusted server, never accepted as a client claim.
6. Copy the complete repository `firestore.rules` into Firestore > Rules and publish, or deploy that file with Firebase CLI from your own authenticated terminal. Do not replace it with public read/write access. Rules require a verified email and match the authenticated UID to the document path.
7. Under Authentication > Settings > Authorized domains add the actual deployed hostname, expected to be `kagankurubas.github.io` for the Pages build. Add `localhost` only for local development if needed. Do not add URL paths or `https://` to domain entries.
8. Google and Email/Password are enabled by the applicant. In Authentication settings enable email enumeration protection and set an appropriate password policy. The UI requires at least 12 characters for new email accounts; server-side policy should enforce this too.
9. Perform a human acceptance check on the HTTP(S) site: Google login, email registration, verification email, reload/check verification, account-specific cart/favorite persistence, sign-out, another account, and password reset. Do not put passwords or mail verification links in agent prompts or recordings.

Google sign-in and Firestore have no-cost usage allowances on Spark. Cloud Functions requires Blaze; using Firebase for identity and storage does not imply committing to that paid plan. Payment and AI server hosting will be decided separately before asking for any billing setup.

Official references:
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/firestore/security/rules-conditions

## Publishing preparation

`scripts/publish-github.ps1` runs in the applicant's own authenticated terminal. It checks the expected GitHub account, validates no env files/private snapshots are tracked, commits only new agent log entries, creates the public `kagankurubas/aisle` repository or reuses its matching public origin, pushes without force, enables GitHub Pages Actions publishing and dispatches the workflow. It refuses unrelated remotes or uncommitted source changes.

The workflow tests and builds the store for `/aisle/`. The publishing script reads only the six explicitly allowlisted `VITE_FIREBASE_*` browser config values from ignored `.env.local` into repository Actions variables. It never uploads that file or any private key. Repository creation and deployment are not verified until the applicant runs the script and we inspect the resulting repository and workflow.

## Current boundaries

The downloaded standalone demo intentionally remains offline with sign-in disabled. It is for UI exploration. Authentication must be tested on an authorized HTTP(S) domain. Actual Firestore rules publication and email/Google flows are not confirmed by compilation alone.


## Optional exam demo sign-in (current implementation)

Enable Firebase Anonymous provider and publish this version's complete Firestore rules before trying the new Try a demo account button. Signed anonymous users have private UID-scoped shopping/lists and server access to Pip and sandbox payments; unverified email users remain blocked. Anonymous identities are not shared passwords and may be unrecoverable after sign-out. See DEMO-ACCOUNT.md.
