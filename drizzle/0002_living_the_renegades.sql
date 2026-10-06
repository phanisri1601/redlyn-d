CREATE TABLE `preview_tickets` (
	`token` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text,
	`reviewer_token` text,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `preview_ticket_expiry` ON `preview_tickets` (`expires`);