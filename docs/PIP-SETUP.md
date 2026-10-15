# Pip AI setup and validation

Implementation is ready; live provider calls have NOT been validated yet. Existing Firebase and payment credentials are unchanged. No Firestore rule change is needed.

## Vercel Production setup

1. Create a dedicated OpenAI API project and API key at https://platform.openai.com/api-keys. Configure project usage alerts and the available provider limits; alerts alone are not a guaranteed hard spending cap. ChatGPT/Codex access does not establish that API credit is available. Never send the key through chat or commit it.
2. Create an Upstash Redis database, or connect Upstash Redis through Vercel Storage/Marketplace. Use its HTTPS REST URL and standard read/write REST token. Read-only tokens cannot maintain counters. Check the service's current plan and limits before accepting paid options.
3. In Vercel → Aisle → Settings → Environment Variables, add these for **Production**, without a `VITE_` prefix:

   | Variable | Value |
   | --- | --- |
   | `OPENAI_API_KEY` | Dedicated OpenAI project key |
   | `UPSTASH_REDIS_REST_URL` | `https://…upstash.io` REST endpoint, not `redis://` |
   | `UPSTASH_REDIS_REST_TOKEN` | Standard REST token |
   | `PIP_ENABLED` | `true` |

   If the Vercel integration generated a different prefix, explicitly map its values to the names above. Do not overwrite the three payment variables.
4. Publish the source with `scripts/publish-github.ps1`; wait for Pages and Vercel success. If variables were added after the deployment started, redeploy Vercel so the function receives them.
5. Use the GitHub Pages store, sign in with a verified account and open Pip. The server endpoint is `https://aisle-roan.vercel.app/api/guide`.
6. To pause AI calls, set `PIP_ENABLED=false` and redeploy. Missing/failed quota storage blocks requests before any OpenAI call.

## Behavior and privacy

- OpenAI Responses API, pinned `gpt-4.1-mini-2025-04-14`; strict JSON Schema. Catalog IDs, duplicate recommendations, text size and explicit per-item budget are checked again on the server. Prices shown by the UI come from the catalog, never AI text.
- This is a 12-product sample catalog, not live merchant inventory. AI explanations can still contain errors. No live web search, arbitrary tools, automatic purchases, cart changes or account access by the model.
- Latest question and up to two earlier question/answer exchanges are sent. Browser keeps up to five visible turns in React memory; closing Pip or switching accounts clears them. Aisle does not save chats in localStorage, Firestore or logs.
- Server strips obvious emails and 10–19 digit sequences before the provider request; this is only a precaution and cannot reliably remove arbitrary personal information. Do not enter private information.
- Firebase ID token is verified server-side; token, email, name, bag, orders, delivery details and payment credentials are not passed to OpenAI. Only bounded chat text, optional budget and public catalog facts are sent. `store:false` disables stored Responses state; it is not a promise of zero retention by the provider.
- Redis stores counts under hashed account IDs and fixed UTC day/minute keys, not chat text. Keys expire after at most 48 hours from their last attempt. Request content/credentials/provider errors are never logged by application code. Hosting/service access metadata may still exist.

## Cost and abuse controls

- Verified account and fixed allowed origins; CORS is not an authentication boundary.
- Redis atomic multi-exec reserves counters BEFORE calling OpenAI, across function instances: 5 requests/account/minute, 20/account/UTC day, 20 global/minute and 200 global/UTC day. Rejected/failed attempts can consume slots; no retries or automatic refunds. A UTC midnight boundary permits two adjacent daily allowances.
- Maximum 6 bounded context messages, 6 KB JSON body, 900 output tokens/request, 18-second model timeout, 4-second Redis timeout. Model selection and output cap cannot be overridden by client requests.
- Redis failure or missing configuration fails closed. Shared-account creation can still exhaust the small global allowance; this is prototype cost protection, not comprehensive bot prevention. Redis access itself incurs service usage.

## Local verification completed

22 automated tests pass, including catalog parity, unknown/over-budget/duplicate IDs, input bounds/redaction, fail-closed configuration, durable counter responses, request ordering, sanitized provider failures, malformed/lazy JSON, origins and auth. Production build passes. Local guest UI and sign-in handoff checked in browser. Model/Redis behavior was tested using injected fixtures; no live credentials were available and no paid model call was made.

## Live acceptance checklist (pending credentials)

1. Signed-out user cannot submit; verified account can.
2. Ask `Headphones under $150 for my commute`, also set Max per item to 150. Only catalog headphones within the explicit cap should be returned, with accurate reasons.
3. Follow up `Which has the longer battery life?`; verify context and catalog values. Ask the same in Turkish; response should follow the language.
4. Ask `Compare AirPods and Beats Flex`; verify 5/12-hour battery and no noise cancellation from current sample specs.
5. Set budget to 10 USD and ask for a laptop: explain there is no match, never invent a cheap laptop.
6. Open product details; add and compare explicitly. Pip never changes the bag on its own.
7. Close/reopen Pip and sign out: conversation must be gone. Refresh preserves existing shopping data independently.
8. Send six short questions within a minute: quota response should stop additional calls. Inspect Redis counts and OpenAI usage without exposing tokens/prompts. Wait for next minute for recovery (daily limit still applies).
9. Confirm missing/disabled provider setup gives a clear error, with bag and lists untouched. Complete the final security scan and broad bug sweep after activation.

References: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [model documentation](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [Upstash REST transactions](https://upstash.com/docs/redis/features/restapi#transactions).
