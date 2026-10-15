# iyzico Sandbox on Vercel

The primary store can stay on https://kagankurubas.github.io/Aisle/.
Its browser calls https://aisle-roan.vercel.app/api/payment over HTTPS.
Vercel builds the same repository and supplies the Node.js API route.

## Configure privately in Vercel

Project: Aisle → Settings → Environment Variables. Select Production.

| Variable | Source |
| --- | --- |
| `IYZICO_SANDBOX_API_KEY` | iyzico Sandbox merchant settings API key |
| `IYZICO_SANDBOX_SECRET_KEY` | iyzico Sandbox merchant settings secret key |
| `PAYMENT_SESSION_KEY` | independent random 32-byte key, 64 hexadecimal characters |

Never use `VITE_` for these three variables. Never send them to chat, capture logs,
GitHub Actions variables, or commit them. Both provider keys must begin with
`sandbox-`. The endpoint is hardcoded to sandbox and cannot make live charges.

To generate the session key straight into the Windows clipboard, without printing it:

```powershell
$aisleSessionBytes = New-Object byte[] 32
$aisleRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$aisleRng.GetBytes($aisleSessionBytes)
$aisleRng.Dispose()
Set-Clipboard -Value ([BitConverter]::ToString($aisleSessionBytes).Replace('-', '').ToLowerInvariant())
```

Paste into the PAYMENT_SESSION_KEY value in Vercel, save, then clear the clipboard.
Redeploy after changing variables. Production deployment protection must allow
public access to the callback and API; preview deployments are not callback targets.

No Firebase service-account private key is needed: server checks the Firebase ID
token's RSA signature against Google's cached public certificates, exact project,
issuer, expiry, issue/auth time, subject and verified email. Project defaults to
aisle-4f23e; optional server-only FIREBASE_PROJECT_ID can override it.

The Vercel frontend itself requires the six public VITE_FIREBASE_* variables from
.env.local if used as the store. GitHub Actions variables are not copied to Vercel
automatically. The GitHub Pages frontend already has these configured and can
use the payment API without migrating the store to Vercel.

## Flow

1. Sign into the primary store with a verified account; open bag → checkout → review.
2. Choose **Pay with iyzico test cards**. A new tab opens the provider's hosted page.
3. Enter only official sandbox card details. The app never collects card fields.
4. After the provider finishes, close that tab and choose **Verify payment** in Aisle.
5. Server retrieves the result, verifies provider HMAC, token, basket/conversation,
   USD amount, payment status and fraud approval before returning a test receipt.

Prices and stock come from server/catalog.json, checked against storefront data
by tests. Client-supplied prices and malformed/duplicate quantities are rejected.
USD is preserved; this is not TRY conversion. If this sandbox merchant does not
support USD, resolve its currency setup; do not silently change the amount/currency.

Delivery form values, real email, name, address and identity number are not sent.
Server uses fictional sandbox fixtures. Only product data is sent to iyzico.
User ID and provider token are inside an authenticated encrypted 30-minute ticket
kept in React memory; refreshing or closing checkout loses it. Account switches
cannot use another account's ticket. No request payload/token/credentials are logged.

Callback GET/POST only displays return instructions. It grants no payment authority.
Repeated **Verify payment** calls retrieve the same result and perform no fulfilment.
There is no paid-order database, webhook-driven fulfilment, refund, real inventory
reservation, or durable receipt history in this test integration. The bag stays
unchanged. Offline demo orders remain a separate feature and are never described
as provider-verified payments. A production store needs durable idempotent order
processing, revocation checks, global rate limiting/App Check, and reconciliation.

## Verification

`npm test` exercises catalog parity, server-side price/quantity validation, encrypted
ticket tamper/expiry/ownership rejection, JWT RSA verification, exact sandbox request
signing, provider result signature and amount/basket/currency matching.
`npm run build` verifies the client. Tests use synthetic keys and mock provider
responses, never a merchant account. Live provider success/decline, browser popup,
callback accessibility and Vercel function packaging still need deployment testing.

References:
- https://docs.iyzico.com/odeme-metotlari/odeme-formu/cf-entegrasyonu/cf-baslatma
- https://docs.iyzico.com/odeme-metotlari/odeme-formu/cf-entegrasyonu/cf-sorgulama
- https://docs.iyzico.com/en/advanced/response-signature-validation
- https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth
- https://firebase.google.com/docs/auth/admin/verify-id-tokens

## User-observed deployment result

The user completed the hosted USD sandbox flow with a cross-border test card and
shared the Aisle server-verified receipt for USD 129.00, provider reference 38308661.
The domestic test card was rejected by the provider for foreign currency; use its
official cross-border test card for USD. A provider-declined transaction still needs
end-to-end validation. Success now opens the Done screen, showing the verified
amount/reference and Continue shopping; the offline demo controls are hidden.


## Separate TRY error diagnostic

The hosted form rejected the insufficient-funds card before submission for a USD
transaction (local-card foreign-currency restriction). Checkout now offers a clearly
labelled separate TRY 1.00 diagnostic, with a virtual test item and no bag conversion.
Its currency and mode are encrypted into the session and checked on retrieval; a
diagnostic success cannot complete the USD bag. Provider-hosted decline and recovery
still need user validation. Thirteen tests pass, including fixed diagnostic amount
and currency separation; the production build passes. The tamper test now flips an
actual encrypted byte rather than replacing a character that could already match.

