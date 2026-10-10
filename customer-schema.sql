CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL, salt TEXT NOT NULL, recovery_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS favorites (customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE, sku TEXT NOT NULL, PRIMARY KEY(customer_id, sku));
CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, topic TEXT NOT NULL, sku TEXT NOT NULL DEFAULT '', message TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS rate_expiry ON rate_limits(expires_at);
CREATE INDEX IF NOT EXISTS inquiries_created ON inquiries(created_at);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (email TEXT PRIMARY KEY, subscribed INTEGER NOT NULL DEFAULT 0 CHECK (subscribed IN (0,1)), consented_at INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);
