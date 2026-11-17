-- Cloudflare D1: Stripe payment order ledger. No card numbers are stored.
CREATE TABLE IF NOT EXISTS checkout_orders (
 id TEXT PRIMARY KEY,
 cart_json TEXT NOT NULL,
 items_total_cents INTEGER NOT NULL,
 shipping_cents INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'initiated',
 stripe_session_id TEXT UNIQUE,
 customer_email TEXT,
 shipping_name TEXT,
 shipping_address_json TEXT,
 amount_paid_cents INTEGER,
 created_at INTEGER NOT NULL,
 paid_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_checkout_orders_created ON checkout_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_checkout_orders_status ON checkout_orders(status);
