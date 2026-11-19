CREATE TABLE IF NOT EXISTS storefront_products (
  sku TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, data TEXT NOT NULL,
  published INTEGER NOT NULL CHECK(published IN (0,1)),
  in_stock INTEGER NOT NULL CHECK(in_stock IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS storefront_copy (
  path TEXT PRIMARY KEY, heading TEXT NOT NULL, body TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS shipment_tracking (
  order_id TEXT PRIMARY KEY REFERENCES checkout_orders(id),
  carrier TEXT NOT NULL, tracking TEXT NOT NULL, updated_at INTEGER NOT NULL
);
