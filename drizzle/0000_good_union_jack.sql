CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`author` text NOT NULL,
	`text` text NOT NULL,
	`internal` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activity_project` ON `activity` (`project_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`page` text NOT NULL,
	`author` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`feedback_id` text NOT NULL,
	`comment_id` text,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`internal` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `attachments_feedback` ON `attachments` (`feedback_id`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`feedback_id` text NOT NULL,
	`author` text NOT NULL,
	`text` text NOT NULL,
	`internal` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `comments_feedback` ON `comments` (`feedback_id`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`number` integer NOT NULL,
	`author` text NOT NULL,
	`text` text NOT NULL,
	`internal` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`device` text NOT NULL,
	`anchor` text NOT NULL,
	`page` text NOT NULL,
	`metadata` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_project` ON `feedback` (`project_id`,`status`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires` integer NOT NULL,
	`accepted` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_token_hash_unique` ON `invitations` (`token_hash`);--> statement-breakpoint
CREATE TABLE `links` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`label` text DEFAULT 'Client link' NOT NULL,
	`expires` integer,
	`revoked` integer DEFAULT 0 NOT NULL,
	`require_email` integer DEFAULT 0 NOT NULL,
	`password` text,
	`can_comment` integer DEFAULT 1 NOT NULL,
	`can_approve` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `links_token_hash_unique` ON `links` (`token_hash`);--> statement-breakpoint
CREATE TABLE `members` (
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'developer' NOT NULL,
	PRIMARY KEY(`project_id`, `user_id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`client` text DEFAULT '' NOT NULL,
	`url` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`environment` text DEFAULT 'staging' NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviewers` (
	`token` text PRIMARY KEY NOT NULL,
	`link_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);