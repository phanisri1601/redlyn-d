ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
CREATE TABLE auth_tokens(token TEXT PRIMARY KEY, user_id TEXT NOT NULL, purpose TEXT NOT NULL, expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE INDEX auth_tokens_expiry ON auth_tokens(expires);
CREATE TABLE notifications(id TEXT PRIMARY KEY, user_id TEXT NOT NULL, project_id TEXT NOT NULL, feedback_id TEXT NOT NULL, author TEXT NOT NULL, text TEXT NOT NULL, internal INTEGER NOT NULL DEFAULT 0, read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, email_state TEXT NOT NULL DEFAULT 'disabled');
CREATE INDEX notification_user ON notifications(user_id,created_at);
CREATE TABLE subscriptions(owner_id TEXT PRIMARY KEY, subscription_id TEXT UNIQUE NOT NULL, customer_id TEXT NOT NULL, product_id TEXT NOT NULL, plan TEXT NOT NULL, status TEXT NOT NULL, valid_until INTEGER, cancel_at_end INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);
CREATE TABLE billing_checkouts(id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, session_id TEXT, plan TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX checkout_owner ON billing_checkouts(owner_id,created_at);
CREATE TABLE billing_events(id TEXT PRIMARY KEY, created_at INTEGER NOT NULL);
