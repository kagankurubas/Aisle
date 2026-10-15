# Pip AI — free exam setup and validation

Implementation is ready; live provider calls have NOT been validated yet. Existing Firebase and payment credentials are unchanged. No Firestore rule change is needed.

## Vercel Production setup

1. Open https://aistudio.google.com/api-keys and create a **new, separate project**, for example `aisle-pip-exam`. Confirm its Billing Tier is **Free Tier** and no Cloud Billing account is linked. Do not reuse the Firebase project or browser key. Do not click Set up billing, add a payment method or buy credits. A key does not prove a project is free; its project billing status controls charges. The app cannot infer billing status from the key, so verify this before activation.
2. Create a **Free** Upstash Redis database at https://console.upstash.com. Keep it on Free without adding a card/upgrading to pay-as-you-go. Copy its HTTPS REST URL and standard read/write REST token. Free plan limits may stop requests; they must not be bypassed by enabling a paid plan. Its current pricing lists a free tier; check the plan label in your own account.
3. In Vercel → Aisle → Settings → Environment Variables, add these for **Production**, without a `VITE_` prefix:

   | Variable | Value |
   | --- | --- |
   | `GEMINI_API_KEY` | Key from the new unbilled Free Tier project |
   | `UPSTASH_REDIS_REST_URL` | `https://…upstash.io` REST endpoint, not `redis://` |
   | `UPSTASH_REDIS_REST_TOKEN` | Standard REST token |
   | `PIP_ENABLED` | `true` |

   If the Vercel integration generated a different prefix, explicitly map its values to the names above. Do not overwrite the three payment variables.
4. Publish the source with `scripts/publish-github.ps1`; wait for Pages and Vercel success. If variables were added after the deployment started, redeploy Vercel so the function receives them.
5. Use the GitHub Pages store, sign in with a verified account and open Pip. The server endpoint is `https://aisle-roan.vercel.app/api/guide`.
6. To pause AI calls, set `PIP_ENABLED=false` and redeploy. Missing/failed quota storage blocks requests before any Gemini call.

## Behavior and privacy

- Gemini `generateContent` API, fixed `gemini-3.5-flash-lite`; JSON Schema output. Catalog IDs, duplicate recommendations, text size and explicit per-item budget are checked again on the server. Prices shown by the UI come from the catalog, never AI text.
- This is a 12-product sample catalog, not live merchant inventory. AI explanations can still contain errors. No live web search, arbitrary tools, automatic purchases, cart changes or account access by the model.
- Latest question and up to two earlier question/answer exchanges are sent. Browser tab sessionStorage keeps up to 10 chats with up to 10 turns each, scoped to the signed-in account. Closing/reopening Pip and refreshing restore history; it is not synced to other devices. New chat starts a separate conversation; Recent chats supports reopening and deletion. Another account cannot see the previous account’s chat in the UI. Chats are not sent to Firestore or application logs. Browser session restoration may retain sessionStorage; delete chats on shared devices.
- Server strips obvious emails and 10–19 digit sequences before the provider request; this is only a precaution and cannot reliably remove arbitrary personal information. Do not enter private information.
- Firebase ID token is verified server-side; token, email, name, bag, orders, delivery details and payment credentials are not passed to Google Gemini. Only bounded chat text, optional budget and public catalog facts are sent. `store:false` requests that provider request logging be disabled; it is NOT a promise of zero retention or exclusion from product improvement. Google states Free Tier content may be used to improve its products. The UI discloses this. Never send real customer, payment or sensitive information.
- Redis stores counts under hashed account IDs and fixed UTC day/minute keys, not chat text. Keys expire after at most 48 hours from their last attempt. Request content/credentials/provider errors are never logged by application code. Hosting/service access metadata may still exist.

## Cost and abuse controls

- Verified account and fixed allowed origins; CORS is not an authentication boundary.
- Redis atomic multi-exec reserves counters BEFORE calling Gemini, across function instances: 5 requests/account/minute, 20/account/UTC day, 20 global/minute and 200 global/UTC day. Rejected/failed attempts can consume slots; no retries or automatic refunds. A UTC midnight boundary permits two adjacent daily allowances.
- Maximum 6 bounded context messages, 6 KB JSON body, 900 output tokens/request (including any model thinking tokens), 18-second model timeout, 4-second Redis timeout. Model selection and output cap cannot be overridden by client requests.
- Redis failure or missing configuration fails closed. Shared-account creation can still exhaust the small global allowance; this is prototype cost protection, not comprehensive bot prevention. Redis access itself consumes free service quota; storage failure blocks AI requests.

## Local verification completed

23 automated tests pass, including catalog parity, unknown/over-budget/duplicate IDs, input bounds/redaction, fail-closed configuration, durable counter responses, request ordering, sanitized provider failures, malformed/lazy JSON, origins and auth. Production build passes. Local guest UI and sign-in handoff checked in browser. Gemini/Redis behavior was tested using injected fixtures; no live Gemini credentials were available and no live model call was made.

## Live acceptance checklist (pending credentials)

1. Verify Google AI Studio project is Free Tier with no billing linked and Upstash is Free. Signed-out user cannot submit; verified account can.
2. Ask `Headphones under $150 for my commute`, also set Max per item to 150. Only catalog headphones within the explicit cap should be returned, with accurate reasons.
3. Follow up `Which has the longer battery life?`; verify context and catalog values. Ask the same in Turkish; response should follow the language.
4. Ask `Compare AirPods and Beats Flex`; verify 5/12-hour battery and no noise cancellation from current sample specs.
5. Set budget to 10 USD and ask for a laptop: explain there is no match, never invent a cheap laptop.
6. Open product details; add and compare explicitly. Pip never changes the bag on its own.
7. Close/reopen Pip and refresh: saved chats should remain for this account in the same tab. Switch accounts: no previous-account chats appear. Delete a chat: it must stay deleted when reopened. Shopping data remains independent.
8. Send six short questions within a minute: quota response should stop additional calls. Inspect Redis counts and AI Studio usage without exposing tokens/prompts. Wait for next minute for recovery (daily limit still applies).
9. Exhausted provider quota returns 429 with a free-quota message and makes no retry/fallback request. Confirm missing/disabled provider setup gives a clear error, with bag and lists untouched. Complete the final security scan and broad bug sweep after activation.

## Zero-budget boundary

The zero-budget design relies on an **unbilled Gemini Free Tier project** and **Upstash Free**. Keep existing Vercel/Pages on their free plans. There is no OpenAI request path, paid fallback, paid tools, external search, account upgrade or auto-retry in Pip. If someone later links billing to the Gemini project, the same API key can become billable; app request limits alone do not make a paid account free. Do not upgrade these accounts for this exam. Model availability and free quotas vary by account/region and can change; inspect AI Studio's active model limits before the live test. If unavailable, stop and adjust to another confirmed free model rather than enabling billing.

References: [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), [Free/Paid billing](https://ai.google.dev/gemini-api/docs/billing), [model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [generateContent API](https://ai.google.dev/api/generate-content), [Upstash Free](https://upstash.com/pricing/redis).


## User-confirmed live checks

Turkish recommendations under 150 USD, grounded 12/5-hour battery comparison/selection, and no laptop recommendation under 10 USD passed via user screenshots. Remaining live acceptance checks are still pending. New history UI uses tab sessionStorage; local fixture browser tests verified listing and reopening another chat with its budget, plus automated account-isolation/corruption/size/storage-failure checks. Modal inside-to-outside drag remains open, ordinary outside click closes. 25 tests and build pass. No model call was made for this UI verification.
