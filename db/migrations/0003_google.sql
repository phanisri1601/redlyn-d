ALTER TABLE users ADD COLUMN google_id TEXT;
CREATE UNIQUE INDEX users_google_id_unique ON users(google_id);
