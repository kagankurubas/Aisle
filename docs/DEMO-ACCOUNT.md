# Demo sign-in and exam UI update

## Activate demo sign-in

1. Firebase Console → project `aisle-4f23e` → Authentication → Sign-in method → Add new provider → Anonymous → Enable → Save. No upgrade/billing change is required for this implementation. Keep the existing free plan. Do not create a shared email/password account or put a password into the website.
2. Firestore Database → Rules: replace with the complete `firestore.rules` from this version and Publish. The output copy is identical. Existing personal cart/list documents are not deleted or migrated.
3. Run the existing `scripts/publish-github.ps1` in your own PowerShell and wait for GitHub Pages and Vercel success. If the code was published before the Firebase changes, refresh afterward. No new Vercel secrets are needed.
4. In the store, sign out from the personal account, open Sign in, choose **Try a demo account**. Landing should stay on the home page; header shows Demo shopper. Test cart, favorites, named lists, Pip and sandbox checkout. Refresh should preserve this tab's signed-in demo session and cloud data.
5. Use another browser/private window/device to create another demo session. Its bag and lists must be separate. Signing out or losing the browser session can lose access to an anonymous account permanently; there is no password recovery. This is not one shared account across devices. A new session may start with an empty bag. Existing personal/guest data stays separate and is not merged automatically.

## Security boundaries

Firebase creates the anonymous account and signs the ID token. Server still validates RS256 signature, project, issuer, expiry, subject and authentication time. Only a signed `firebase.sign_in_provider=anonymous` claim qualifies as demo access; an unverified email/password account or a client-supplied demo flag does not qualify. Firestore owner checks and strict payload restrictions remain. Session receipts remain bound to the UID. No API accepts an arbitrary UID or bypass token. Anonymous account creation can be abused to consume shared free quotas; final security sweep must include this exposure. Firebase's own signup limits and Pip's existing global durable quotas still apply. No real-payment path is introduced.

## Other changes in this release

- Test cards are visible before and after opening the payment tab. Card numbers can be copied, with expiry 12/30, CVC 123 and Demo Shopper name. Footer **Test cards & demo tools** opens all sample cards. USD success card is separate from TRY diagnostic cards.
- Removed decorative shelf lines, including the mobile repeated background. Category headings and open product layout remain.
- Header theme toggle supports light/dark, follows system preference initially and saves an explicit choice on this device. Main panels, forms, account sections and product imagery adapt.
- Full product pages use portable hash URLs, for example `#product/100` and `#product/100/reviews`, so Pages hosting and refresh work without extra rewrites. Default product click stays a quick-view dialog; **View full product page & reviews** opens the page. Unknown IDs show a useful not-found view.
- Reviews contain two explicitly illustrative examples per product. Scores and counts are also demo values; no real review submission, verified-purchase system or cloud review storage is claimed.
- Pip limits stay 20/account/UTC day and 200 globally/UTC day; 5/account/minute and 20 globally/minute. Provider quotas may stop service sooner. Account day resets at UTC midnight (03:00 Istanbul). New demo identities share the same global limit.

## Validation and pending live checks

26 application tests, 8 Firestore emulator tests and production build pass. New tests cover anonymous owner isolation, valid shopping/list payloads, denial of other UIDs and fake paid records, JWT provider claims and client account eligibility. Browser checked theme switching/persistence, desktop and 390px mobile product page, quick-view-to-full-page link, refresh, review anchor, unknown ID and test-card copying. No live anonymous account, AI call or provider payment was created in these checks. Live demo sign-in remains pending enabling the provider and publishing rules.

Reference: https://firebase.google.com/docs/auth/web/anonymous-auth
