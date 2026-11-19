CREATE TABLE IF NOT EXISTS storefront_media (
  id TEXT PRIMARY KEY, mime TEXT NOT NULL, contents BLOB NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS storefront_layout (
  id INTEGER PRIMARY KEY CHECK(id=1), ordering TEXT NOT NULL, hidden TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tracking_delivery (
  order_id TEXT NOT NULL REFERENCES checkout_orders(id),
  carrier TEXT NOT NULL, tracking TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('sending','retry','sent','uncertain')),
  attempts INTEGER NOT NULL, next_attempt INTEGER NOT NULL, lease TEXT NOT NULL,
  PRIMARY KEY(order_id,carrier,tracking)
);
CREATE TABLE IF NOT EXISTS label_quotes (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES checkout_orders(id),
  rate_id TEXT NOT NULL, carrier TEXT NOT NULL, service TEXT NOT NULL,
  cents INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS purchased_labels (
  order_id TEXT PRIMARY KEY REFERENCES checkout_orders(id),
  quote_id TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','purchased','uncertain')),
  transaction_id TEXT, tracking TEXT, label_url TEXT
);
