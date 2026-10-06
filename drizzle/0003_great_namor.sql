CREATE TABLE `workspace_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires` integer NOT NULL,
	`accepted` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_invitations_token_hash_unique` ON `workspace_invitations` (`token_hash`);--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`owner_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'developer' NOT NULL,
	PRIMARY KEY(`owner_id`, `user_id`)
);
--> statement-breakpoint
CREATE TABLE `workspace_settings` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
