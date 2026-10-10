# Elvarins customer services

Customer accounts support signup, sign-in, sign-out, a recovery code and saved products. They do not place orders or process payments. Email addresses are not verified; do not associate account profiles with existing purchases solely by matching an email address.

Passwords use salted scrypt hashes (N=16384, r=8, p=5). Session and recovery tokens are randomly generated and stored as SHA-256 hashes. Sessions expire after seven days; cookies are Secure, HttpOnly and SameSite=Strict. Mutations require same-origin JSON requests. Signup, sign-in, recovery and inquiries have persistent limits. Recovery rotates the code and revokes existing sessions.

The customer-care form stores a request and returns its reference number. It does not send an email notification. The owner can review requests in Cloudflare Dashboard → Workers & Pages → D1 → `elvarins-customer-services` → Console:

```sql
SELECT id, name, email, topic, sku, message,
       datetime(created_at, 'unixepoch') AS received_at
FROM inquiries ORDER BY created_at DESC LIMIT 100;
```

Reply using the existing business email. Verify identity before fulfilling privacy requests or disclosing purchase information. Never expose this query or database access to the public website. The public Worker does not serve this document or its server modules.

Requests older than two years are removed during subsequent form/account mutations. Export or resolve records needed for an unresolved purchase or legal obligation before the retention window expires. Accounts persist until the owner processes a verified deletion request; session and rate records are automatically expired/cleaned. No payment credentials are collected.

The privacy control stores a browser choice and honors Global Privacy Control. No advertising tracker is enabled. Essential sessions and preferences continue to work. The shopping invitation is dismissible and appears at most once in seven days after an engaged visitor has spent 45 seconds browsing. Visitors can pause motion; reduced-motion settings are respected.

## Validation

Run `tests/retail.mjs` with Node 22+ and Miniflare installed. The test uses a local database only and covers product/collection routes, account lifecycle, recovery/session invalidation, saved favorites, inquiry validation, CSRF checks and throttling. A Miniflare package outside the repository can be supplied with `ELVARINS_TEST_MINIFLARE`.

## Email subscriptions
The newsletter endpoint records email, consent time and subscription status in `newsletter_subscribers`. Marketing campaigns and email verification are not configured. Do not send campaigns until a provider is connected with unsubscribe handling and appropriate verification. Opt-outs remain in a minimal suppression record. `/newsletter` processes unsubscribe requests without login. `/track-order` stores a customer-care shipping request; it is not an automated shipment lookup.
