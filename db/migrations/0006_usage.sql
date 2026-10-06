CREATE TABLE usage_daily (owner_id TEXT NOT NULL, day TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(owner_id,day));
