CREATE TABLE `citations` (
	`id` integer PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`experiment` integer NOT NULL,
	`from` integer NOT NULL,
	`to` integer NOT NULL,
	FOREIGN KEY (`experiment`) REFERENCES `experiments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `citations_from_to_experiment_unique` ON `citations` (`from`,`to`,`experiment`);--> statement-breakpoint
CREATE TABLE `experiments` (
	`id` integer PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`name` text NOT NULL,
	`problem` text NOT NULL,
	`profile` text DEFAULT 'research' NOT NULL,
	`model` text NOT NULL,
	`agent_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `experiments_name_unique` ON `experiments` (`name`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`experiment` integer NOT NULL,
	`agent` integer NOT NULL,
	`position` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`total_tokens` integer DEFAULT 0 NOT NULL,
	`cost` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`experiment`) REFERENCES `experiments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `messages_experiment_agent_position_unique` ON `messages` (`experiment`,`agent`,`position`);--> statement-breakpoint
CREATE TABLE `publications` (
	`id` integer PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`experiment` integer NOT NULL,
	`author` integer NOT NULL,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`reference` text NOT NULL,
	FOREIGN KEY (`experiment`) REFERENCES `experiments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `publications_experiment_reference_unique` ON `publications` (`experiment`,`reference`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`experiment` integer NOT NULL,
	`publication` integer NOT NULL,
	`author` integer NOT NULL,
	`grade` text,
	`content` text,
	FOREIGN KEY (`experiment`) REFERENCES `experiments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`publication`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_author_publication_unique` ON `reviews` (`author`,`publication`);--> statement-breakpoint
CREATE TABLE `solutions` (
	`id` integer PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`experiment` integer NOT NULL,
	`publication` integer NOT NULL,
	`agent` integer NOT NULL,
	FOREIGN KEY (`experiment`) REFERENCES `experiments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`publication`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `solutions_idx_experiment` ON `solutions` (`experiment`);--> statement-breakpoint
CREATE UNIQUE INDEX `solutions_experiment_agent_unique` ON `solutions` (`experiment`,`agent`);