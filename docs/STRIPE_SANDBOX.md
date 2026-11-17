# Stripe sandbox checkout (not live)
This branch adds an isolated test checkout at `/checkout-sandbox.html` plus `POST /api/create-sandbox-checkout`. It does **not** replace inquiry-only site purchase flows or accept live payments.

## Security
- The earlier Stripe `sk_test_` credential was pasted into chat. Rotate/revoke it in Stripe before use. Never copy it into code, GitHub, browser JavaScript or public environment variables.
- Provision a fresh **test-mode** secret using Cloudflare Pages **Preview** environment secrets only:
  - `STRIPE_TEST_SECRET_KEY` = fresh test-mode secret (encrypted secret; never committed)
  - `STRIPE_CHECKOUT_TEST_ENABLED` = `true`
- Endpoint fails closed if either configuration value is missing. It explicitly refuses a `sk_live_` key.
- The Checkout Session is created with amounts read **server-side** from `catalog/products.json`. Browser prices cannot override catalog pricing.
- When reviewing, check that the Cloudflare Pages project actually deploys the repository root and includes the `functions/` directory.

## Test procedure
1. Merge to a **preview/test branch deployment** only after reviewing Cloudflare deployment settings and ensuring no production environment secrets are enabled.
2. Open `/checkout-sandbox.html` on the preview deployment. Select one catalog product and quantity.
3. Complete test checkout with Stripe's official test card `4242 4242 4242 4242`, a future expiry and arbitrary CVC.
4. Confirm the resulting Checkout Session in **Stripe test mode** and compare product, amount, currency and quantity to the catalog.
5. Test cancelled checkout, invalid SKU, tampered quantity, empty cart, duplicate SKU, missing secret, blocked cross-origin request, and the declined-card test cases recommended by Stripe.
6. Check mobile and desktop layouts.

## Important gaps before real orders
- No verified inventory checks or stock reservations
- No shipping quote, shipping rate, delivery promise or sales-tax compliance
- No signed webhook processor, persistent order database, idempotent fulfillment or refund workflow
- No customer order notifications / receipt handling
- No PayPal integration
- No live keys, live checkout, or working production cart

Do **not** remove the existing inquiry-only messaging or deploy as production checkout until those gaps are resolved. Sandbox 'success' redirect is **not** proof of payment; a verified webhook and order record are required for fulfillment.
