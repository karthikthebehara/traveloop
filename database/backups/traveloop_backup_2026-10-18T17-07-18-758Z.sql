-- ========================================================
-- Traveloop MySQL Database Snapshot
-- Timestamp: 2026-10-18T17:07:19.335Z
-- Database: odoo_hackathon
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Table structure for table `activities`
DROP TABLE IF EXISTS `activities`;
CREATE TABLE `activities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `stop_id` int unsigned NOT NULL,
  `activity_id` int unsigned DEFAULT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` enum('sightseeing','food','transport','accommodation','adventure','shopping','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `scheduled_date` date DEFAULT NULL,
  `duration_hours` decimal(4,1) NOT NULL DEFAULT '1.0',
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `location_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `booking_ref` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_booked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activities_stop` (`stop_id`),
  KEY `idx_activities_category` (`category`),
  KEY `fk_act_catalog` (`activity_id`),
  CONSTRAINT `fk_act_catalog` FOREIGN KEY (`activity_id`) REFERENCES `activities_catalog` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_activities_stop` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `activities_catalog`
DROP TABLE IF EXISTS `activities_catalog`;
CREATE TABLE `activities_catalog` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `city_id` int unsigned NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('sightseeing','food','transport','accommodation','adventure','shopping','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sightseeing',
  `estimated_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `duration_hours` decimal(4,1) NOT NULL DEFAULT '2.0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_act_city` (`city_id`),
  KEY `idx_act_category` (`category`),
  CONSTRAINT `fk_act_cat_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `cities`
DROP TABLE IF EXISTS `cities`;
CREATE TABLE `cities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_code` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Global',
  `cost_index` tinyint unsigned NOT NULL DEFAULT '3',
  `popularity_score` tinyint unsigned NOT NULL DEFAULT '80',
  `image_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cities_name_country` (`name`,`country`),
  KEY `idx_cities_region` (`region`),
  KEY `idx_cities_popularity` (`popularity_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `packing_checklist`
DROP TABLE IF EXISTS `packing_checklist`;
CREATE TABLE `packing_checklist` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `trip_id` int unsigned NOT NULL,
  `item_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT 'General',
  `quantity` smallint unsigned NOT NULL DEFAULT '1',
  `is_packed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_checklist_trip` (`trip_id`),
  CONSTRAINT `fk_checklist_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `saved_destinations`
DROP TABLE IF EXISTS `saved_destinations`;
CREATE TABLE `saved_destinations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `city_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_city` (`user_id`,`city_id`),
  KEY `fk_saved_city` (`city_id`),
  CONSTRAINT `fk_saved_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_saved_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `stops`
DROP TABLE IF EXISTS `stops`;
CREATE TABLE `stops` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `trip_id` int unsigned NOT NULL,
  `city_id` int unsigned DEFAULT NULL,
  `city_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_code` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `arrival_date` date DEFAULT NULL,
  `departure_date` date DEFAULT NULL,
  `order_index` smallint unsigned NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stops_trip_order` (`trip_id`,`order_index`),
  KEY `fk_stops_city` (`city_id`),
  CONSTRAINT `fk_stops_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_stops_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `trip_collaborators`
DROP TABLE IF EXISTS `trip_collaborators`;
CREATE TABLE `trip_collaborators` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `trip_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `role` enum('viewer','editor') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'viewer',
  `invited_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_trip_collaborator` (`trip_id`,`user_id`),
  KEY `fk_collaborators_user` (`user_id`),
  CONSTRAINT `fk_collaborators_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_collaborators_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `trip_expenses`
DROP TABLE IF EXISTS `trip_expenses`;
CREATE TABLE `trip_expenses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `trip_id` int unsigned NOT NULL,
  `trip_stop_id` int unsigned DEFAULT NULL,
  `category` enum('Transport','Stay','Activities','Meals','Other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Other',
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `expense_date` date DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_expenses_stop` (`trip_stop_id`),
  KEY `idx_expenses_trip` (`trip_id`),
  KEY `idx_expenses_category` (`category`),
  KEY `idx_expenses_date` (`expense_date`),
  CONSTRAINT `fk_expenses_stop` FOREIGN KEY (`trip_stop_id`) REFERENCES `stops` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_expenses_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `trip_notes`
DROP TABLE IF EXISTS `trip_notes`;
CREATE TABLE `trip_notes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `trip_id` int unsigned NOT NULL,
  `trip_stop_id` int unsigned DEFAULT NULL,
  `note_date` date DEFAULT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notes_trip` (`trip_id`),
  KEY `fk_notes_stop` (`trip_stop_id`),
  CONSTRAINT `fk_notes_stop` FOREIGN KEY (`trip_stop_id`) REFERENCES `stops` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notes_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `trips`
DROP TABLE IF EXISTS `trips`;
CREATE TABLE `trips` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `total_budget` decimal(10,2) NOT NULL DEFAULT '0.00',
  `daily_budget_threshold` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `sharing_status` enum('private','shared','public') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'private',
  `share_slug` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_image_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trips_user_id` (`user_id`),
  KEY `idx_trips_sharing` (`sharing_status`),
  CONSTRAINT `fk_trips_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` longtext COLLATE utf8mb4_unicode_ci,
  `language_preference` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `users` (1 rows)
INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `email`, `phone`, `city`, `country`, `bio`, `password_hash`, `avatar_url`, `language_preference`, `created_at`, `updated_at`, `role`) VALUES (4, 'Traveloop Administrator', 'Admin', 'Traveloop', 'admin@traveloop.com', NULL, NULL, NULL, NULL, '$2a$12$dm/NyWJFVxONWbBCKwnwo./WC16u4aYdeg7ekAm195UJw0Mne0cLu', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250', 'en', '2026-10-17 22:16:45', '2026-10-18 22:24:39', 'admin');

SET FOREIGN_KEY_CHECKS = 1;
-- Backup Completed Successfully.
