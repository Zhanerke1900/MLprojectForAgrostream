ALTER TABLE `users` ADD `passwordHash` varchar(255);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetTokenHash` varchar(128);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetExpiresAt` timestamp;
