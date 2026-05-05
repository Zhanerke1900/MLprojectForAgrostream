CREATE TABLE `contact_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(64),
	`company` varchar(255),
	`country` varchar(128) NOT NULL,
	`area` varchar(128) NOT NULL,
	`language` enum('ru','en') NOT NULL DEFAULT 'ru',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_requests_id` PRIMARY KEY(`id`)
);
