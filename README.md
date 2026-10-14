# Aisle

A small, considered alternative to an endless marketplace. Products sit on continuous open shelves. A three-product comparison workbench helps shoppers decide without losing their shortlist.

## Run

Node 22.12+ recommended.

```sh
npm ci
npm run dev
npm run build
npm test
```

## Working demo

- Twelve sample products across Audio, Workspace and Everyday, with local WebP images and self-hosted fonts.
- Search, category and budget filters, sorting, product details and saved items.
- Comparison of up to three products of the same kind, with differences-only mode.
- Persistent local bag, stock limits, quantities, removal, saved-for-later and shipping totals.
- Clearly labeled demo sign-in; no shared account or personal information required.
- Two-step test checkout with fictional address, standard/express delivery, success and decline scenarios. Successful orders appear in local order history and can be cancelled or added to the bag again.
- Pip, an animated local catalog guide. It matches catalog type and budget; this preview does **not** call an AI model.
- Keyboard-operable native modal dialogs, reduced-motion support, responsive shelves, lazy-loaded images and separately loaded comparison/checkout/auth modules.

## Deliberate boundaries

This is a browser-local prototype. Prices, stock, specifications, ratings and delivery dates are sample data, not real retail offers. Orders are not sent to a merchant. Checkout does not collect card details, charge money or invoke a payment provider. Address fields are discarded when checkout closes; only synthetic order lines, totals and dates are retained locally. Do not enter real personal information into the demo.

Google OAuth is implemented behind configuration and disabled when it is missing. To enable it, configure the Google provider in Supabase Auth, set allowed redirects to the deployed origin, and provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` via an ignored local `.env`. The SDK uses PKCE. Only the publishable key belongs in a browser build; never add a `service_role` key. Signing in does not enable account cloud sync; demo data stays local.

Real payment-provider integration, account-isolated cloud persistence and model-backed assistance remain future integration work. Those systems require server-side authorization, validated catalog prices, rate limits, database row-level security and verified payment webhooks before production use.

## Security and privacy

- React renders user text without raw HTML. No client SQL execution, SQL string construction, or arbitrary code evaluation exists in the prototype.
- Restored bag data is validated and bounded by the catalog's stock limits.
- No application API secrets are needed by this demo. `.env` files and capture-state snapshots are ignored.
- The storefront makes no external font/image/AI calls in unconfigured demo mode.
- The public source contains anonymous reference notes; screenshots with real addresses or phone numbers were not copied into the repository.
- This is not a claim of a production security audit. Production data isolation must be tested against a configured backend.

## Product decisions

1. Preserve recognizable shopping controls: search, categories, prices, saved items, bag and checkout.
2. Replace isolated product cards with shared physical shelf lines, while keeping product actions visible without hover.
3. Compare only products of the same kind; a headphone-to-laptop table is not useful.
4. Show shipping costs and a free-delivery threshold before checkout.
5. Keep assistance near discovery, rather than as a floating corner chat bubble.
6. Prioritize complete shopping interactions over pretending that unconfigured services work.

## Validation and evidence

`npm test` checks malformed persisted cart input, stock caps, money/shipping calculations, combined search filters and comparison rules. `npm run build` includes strict TypeScript checking.

See `recon/RECON.md` for observed Amazon.com flows, supplemental Amazon Turkey screenshots reviewed in chat, and exact limits of the research. Image provenance is recorded in `recon/ASSET-SOURCES.json`; images were obtained from the DummyJSON sample product catalog. DM Sans is self-hosted from Google Fonts and licensed under the SIL Open Font License.

## Agent capture

`CAPTURE-TEST.md` contains two real-session canaries. `.agent-logs/` is committed during development. `python scripts/capture.py --watch` reads the allowlisted Codex Desktop sessions and automatically appends user prompts and final responses only. Raw local session database snapshots are ignored and deleted after each read. Capture setup issues and recovery are documented honestly in the test record.

## Walkthrough outline (under five minutes, camera on)

1. Introduce Aisle and the open-shelf product decision.
2. Search and filter, open a product, save it and add it to the bag.
3. Select headphones, compare, and toggle only differences.
4. Try Pip's catalog guide and explain its current offline boundary.
5. Show a declined demo payment, recover, place a successful demo order and view order history.
6. Explain the implementation, privacy boundaries and integrations intentionally deferred.

The applicant must record and submit the video personally. The assignment's separate one-minute introduction is a separate deliverable.
