CREATE TABLE `auth_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`purpose` text NOT NULL,
	`expires` integer NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_tokens_expiry` ON `auth_tokens` (`expires`);--> statement-breakpoint
CREATE TABLE `billing_checkouts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`session_id` text,
	`plan` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `checkout_owner` ON `billing_checkouts` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `billing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`feedback_id` text NOT NULL,
	`author` text NOT NULL,
	`text` text NOT NULL,
	`internal` integer DEFAULT 0 NOT NULL,
	`read` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`email_state` text DEFAULT 'disabled' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notification_user` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`product_id` text NOT NULL,
	`plan` text NOT NULL,
	`status` text NOT NULL,
	`valid_until` integer,
	`cancel_at_end` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_subscription_id_unique` ON `subscriptions` (`subscription_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` integer DEFAULT 0 NOT NULL;