# Amazon reference investigation

Observed live on 2026-10-14 UTC. This is a factual record, not a claim that all flows were completed.

## Completed observations

- Home: prominent search, department selector, delivery region, account, orders and cart. Category recommendations are visually dense. Screenshot `01-home.jpg`.
- Sign-in/register: a unified email/mobile-number entry screen; continuing accepts Amazon conditions. No credentials entered, account created or terms accepted. Screenshot `02-sign-in.jpg`.
- Search: searched `wireless headphones`; saw result count, sorting, ratings, color variants and a feature summary. Screenshot `03-search.jpg`.
- Product: Sony WH-CH520 Blue. Product initially could not ship to Turkey; purchase controls were unavailable. Details include image gallery, selectable colors, specifications, features and reviews. Screenshot `04-product.jpg`.
- Delivery: used public example ZIP 10001 to inspect US availability, not the applicant's personal address. After reloading, stock, quantity, delivery dates, price, add-to-cart and buy-now appeared. Screenshot `05-purchase-options.jpg`.
- Add-to-cart: clicking opened an optional protection-plan upsell. Selected No thanks. Amazon then displayed a human-verification checkpoint. No CAPTCHA was completed or bypassed. Screenshot `06-amazon-checkpoint.jpg`.

## Still requires human participation

- Human verification before the cart mutation can complete.
- Account creation/sign-in, account settings, wishlists and order-history flows.
- Cart quantities/removal, checkout address and payment screens, confirmation and returns. Do not place a real order just to investigate.

The applicant has been asked to complete account/protected steps and provide redacted screenshots. Product implementation remains pending completion of reference review or an explicit scope decision from the applicant.

## Aisle decisions informed by observation

1. Keep search, delivery context, account, orders and basket immediately discoverable so the open-shelf design remains recognizably ecommerce.
2. Display a maximum of four products per desktop shelf. Product imagery shares a continuous baseline; no individual card backgrounds.
3. Show price, product name, key attribute and add action without hover. Surface delivery availability before checkout.
4. Separate comparison from browsing: same-category selection, maximum three items, bottom selection bar, comparison workbench and differences-only toggle.
5. Keep optional extras out of the primary basket action. Always confirm an add operation visibly.
6. Support a clearly labeled local demo with synthetic data. Do not represent a simulated payment as a verified provider transaction.
7. Real Google OAuth, server-side checkout and model-backed recommendations require configured services. No fake success states for missing integrations.

## Planned implementation order

Reference review -> responsive open shelves -> searchable catalog and detail -> comparison -> basket -> demo checkout and orders -> real auth and test-provider checkout -> optional AI guide -> access/security/performance QA -> public deployment, public GitHub repository and camera-on walkthrough.

Pending infrastructure: GitHub CLI reported an invalid token. A Sites starter setup attempt refused the existing nonempty repo and made no product changes. Hosting strategy must respect the requested public audience and Google sign-in requirement.
