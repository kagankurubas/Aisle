# Firebase setup (replacement for Supabase)

The applicant's Supabase project limit is exhausted. Proposed replacement: Firebase Authentication for Google sign-in and Cloud Firestore for account-owned shopping data. The current source still uses the inactive Supabase adapter; it will be replaced after the Firebase project is available. Do not configure both providers.

1. Create an Aisle project at https://console.firebase.google.com/ using the no-cost Spark plan. Analytics is optional and unnecessary here. Do not enable billing or upgrade to Blaze for this step.
2. Register a Web app. Keep the browser config locally; never provide a service-account JSON or private key to the frontend.
3. Under Authentication > Sign-in method, enable Google and select the support email. Add the eventual deployed hostname to Authorized domains.
4. Create Cloud Firestore in production mode, choosing a region appropriate to the intended users. Do not enable test-mode public access. The project's default deny rules stay in place until the application-specific rules have been prepared and verified.
5. Account data will be scoped by authenticated UID. The client may access its own cart and favorites only. Payment status and verified orders must be written by a trusted server, never accepted as a client claim.

Google sign-in and Firestore have no-cost usage allowances on Spark. Cloud Functions requires Blaze; using Firebase for identity and storage does not imply committing to that paid plan. Payment and AI server hosting will be decided separately before asking for any billing setup.

Official references:
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/firestore/security/rules-conditions

## Publishing preparation

`scripts/publish-github.ps1` runs in the applicant's own authenticated terminal. It checks the expected GitHub account, validates no env files/private snapshots are tracked, commits only new agent log entries, creates the public `kagankurubas/aisle` repository or reuses its matching public origin, pushes without force, enables GitHub Pages Actions publishing and dispatches the workflow. It refuses unrelated remotes or uncommitted source changes.

The workflow tests and builds the store for `/aisle/`. Public browser configuration will be read from repository Actions variables once the Firebase adapter replaces Supabase. Repository creation and deployment are not verified until the applicant runs the script and we inspect the resulting repository and workflow.
