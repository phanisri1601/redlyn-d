CREATE TABLE preview_tickets (token TEXT PRIMARY KEY, project_id TEXT NOT NULL, user_id TEXT, reviewer_token TEXT, expires INTEGER NOT NULL);
CREATE INDEX preview_ticket_expiry ON preview_tickets(expires);
