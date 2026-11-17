# Elvarins Cloudflare Worker checkout integration
This site deploys as the Cloudflare Worker elvarins-website (not Pages).
Routes: POST /api/checkout; POST /api/stripe/webhook; GET /api/checkout/status.
## Gated configuration
All payment requests fail closed until all required bindings are present:
- CHECKOUT_ENABLED=true
- PAYMENT_MODE=test or live
- STRIPE_TEST_SECRET_KEY (rotated sandbox key) OR STRIPE_LIVE_SECRET_KEY (live approved account)
- STRIPE_WEBHOOK_SECRET (the signing secret matching the active Stripe account mode)
- SHIPPING_CONFIG_VERIFIED=true
- US_SHIPPING_FLAT_CENTS (integer US cents authorized by the business)
- Optional US_FREE_SHIPPING_THRESHOLD_CENTS
- TAX_COMPLIANCE_CONFIRMED=true (only after review of applicable tax obligations)
- Optional STRIPE_TAX_ENABLED=true (paid add-on; only opt in deliberately)
- Existing CUSTOMER_DB D1 binding with checkout-schema.sql applied
Do not reuse test secret pasted into chat. Never put payment secrets in GitHub or public browser code.
## Implemented code
- Persistent cart on product cards and product detail pages
- Server-side SKU/price/quantity validation
- Stripe Checkout with US shipping address and shipping fee from verified configuration
- D1 order ledger with Stripe session association
- Signed webhook verification and independent Stripe payment-status fetch
- Order confirmation page reading server-side status
## Launch review gates
- Confirm exact available quantity per SKU / stock reservation workflow
- Confirm shipping cost, origin, delivery terms, packaging and tax settings
- Verify Stripe merchant identity and provision live API keys in Cloudflare Worker secrets
- Configure webhook, test payment/decline/cancel, refunds and duplicates
- Confirm order email receipt, shipping and fulfillment operational workflow
- PayPal Business gateway requires separate client ID/secret and implementation
- No claim of live payment activation until Stripe and Cloudflare confirm end-to-end paid order flow