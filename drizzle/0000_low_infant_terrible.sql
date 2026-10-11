CREATE TABLE `users` (
	`id` bigint AUTO_INCREMENT NOT NULL COMMENT 'Unique user identifier (primary key)',
	`name` varchar(255) NOT NULL COMMENT 'Full name of the user',
	`email` varchar(255) NOT NULL COMMENT 'Unique email address used for authentication',
	`email_verified_at` timestamp COMMENT 'Timestamp when the user email was verified',
	`password` varchar(255) NOT NULL COMMENT 'Hashed password for authentication',
	`remember_token` varchar(100) COMMENT 'Token for remember-me session persistent authentication',
	`role_access` int NOT NULL DEFAULT 3 COMMENT 'Access role level (1: Super Admin, 2: Admin, 3: User)',
	`created_at` timestamp NOT NULL DEFAULT (now()) COMMENT 'Record creation timestamp',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record last update timestamp',
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
