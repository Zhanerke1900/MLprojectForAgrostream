CREATE TABLE `forecast_calculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`crop` varchar(255) NOT NULL,
	`variety` varchar(255) NOT NULL,
	`predecessor` varchar(255) NOT NULL,
	`area` varchar(128) NOT NULL,
	`sowingDate` varchar(128) NOT NULL,
	`harvestDate` varchar(128) NOT NULL,
	`set` varchar(64) NOT NULL,
	`precipitation` varchar(64) NOT NULL,
	`humus` varchar(64),
	`language` enum('ru','en') NOT NULL DEFAULT 'ru',
	`materialsJson` text NOT NULL,
	`resultJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forecast_calculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contact_requests` ADD `status` enum('new','in_progress','contacted','closed') DEFAULT 'new' NOT NULL;