CREATE TABLE `usage_daily` (
	`owner_id` text NOT NULL,
	`day` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`owner_id`, `day`)
);
