CREATE TABLE workspace_members (owner_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'developer', PRIMARY KEY(owner_id,user_id));
CREATE TABLE workspace_invitations (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, expires INTEGER NOT NULL, accepted INTEGER NOT NULL DEFAULT 0);
CREATE TABLE workspace_settings (owner_id TEXT PRIMARY KEY, name TEXT NOT NULL);
