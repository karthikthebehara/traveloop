-- ========================================================
-- Traveloop MySQL Database Snapshot
-- Timestamp: 2026-10-18T15:56:43.335Z
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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `activities` (24 rows)
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (1, 1, NULL, 'Completing Hackathon', 'do 24 hours hackathon', 'other', '1000.00', NULL, '1.0', NULL, NULL, 'Karpagam University', '', 0, '2026-07-13 19:33:04', '2026-07-13 19:33:04');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (2, 2, NULL, 'view light show atadiyogi statue', 'Viewed beutiful light show', 'sightseeing', '500.00', NULL, '1.0', NULL, NULL, 'adiyogi statue', '`', 1, '2026-07-13 19:35:34', '2026-07-13 19:35:34');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (3, 3, NULL, 'Visiting dhyana lingam', '', 'adventure', '1000.00', NULL, '1.0', NULL, NULL, '', '', 0, '2026-07-13 19:37:43', '2026-07-13 19:37:43');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (4, 4, NULL, 'Visit murugan temple', '', 'sightseeing', '1000.00', NULL, '1.0', NULL, NULL, '', '', 0, '2026-07-13 19:38:33', '2026-07-13 19:38:33');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (5, 5, NULL, 'Giri Pradhikshana', '', 'adventure', '1000.00', NULL, '1.0', NULL, NULL, '', '', 0, '2026-07-13 19:39:22', '2026-07-13 19:39:22');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (6, 6, NULL, 'Visit Rock beach', '', 'sightseeing', '1000.00', NULL, '1.0', NULL, NULL, '', '', 0, '2026-07-13 19:40:28', '2026-07-13 19:40:28');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (7, 6, NULL, 'Visit French Colony', '', 'sightseeing', '1000.00', NULL, '1.0', NULL, NULL, '', '', 0, '2026-07-13 19:40:44', '2026-07-13 19:40:44');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (8, 7, NULL, 'Visit temple', '', 'sightseeing', '500.00', NULL, '1.0', NULL, NULL, '', '', 0, '2026-07-13 19:58:14', '2026-07-13 19:58:14');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (9, 9, NULL, 'Louvre Museum Masterpieces Guided Tour', NULL, 'sightseeing', '45.00', '2026-06-02 00:00:00', '3.0', NULL, NULL, 'Musée du Louvre', NULL, 1, '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (10, 9, NULL, 'Eiffel Tower Summit & Champagne', NULL, 'sightseeing', '85.00', '2026-06-03 00:00:00', '2.5', NULL, NULL, 'Champ de Mars', NULL, 1, '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (11, 9, NULL, 'Montmartre Secret Bakeries & Wine Walking Tour', NULL, 'food', '65.00', '2026-06-04 00:00:00', '3.0', NULL, NULL, 'Place du Tertre', NULL, 0, '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (12, 10, NULL, 'Colosseum, Roman Forum & Palatine Hill Priority Access', NULL, 'sightseeing', '75.00', '2026-06-06 00:00:00', '3.5', NULL, NULL, 'Piazza del Colosseo', NULL, 1, '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (13, 10, NULL, 'Vatican Museums, Sistine Chapel & St. Peter’s', NULL, 'sightseeing', '60.00', '2026-06-07 00:00:00', '3.5', NULL, NULL, 'Vatican City', NULL, 1, '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (14, 10, NULL, 'Trastevere Sunset Pasta & Tiramisu Masterclass', NULL, 'food', '85.00', '2026-06-08 00:00:00', '3.0', NULL, NULL, 'Trastevere', NULL, 1, '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (21, 15, 2, 'Eiffel Tower Summit by Elevator & Champagne', NULL, 'sightseeing', '85.00', '2026-10-18 00:00:00', '2.5', NULL, NULL, 'Paris, France', NULL, 0, '2026-10-18 12:03:17', '2026-10-18 12:03:17');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (22, 16, NULL, 'Visit Temple, Girivalam', '', 'sightseeing', '1000.00', '2026-10-19 00:00:00', '5.0', NULL, NULL, '', '', 0, '2026-10-18 12:05:26', '2026-10-18 12:05:26');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (23, 17, NULL, 'Viisit Rock Beach', '', 'sightseeing', '100.00', '2026-10-20 00:00:00', '1.0', NULL, NULL, '', '', 0, '2026-10-18 12:10:58', '2026-10-18 12:10:58');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (24, 17, NULL, 'Visit Mangrove forest', '', 'sightseeing', '500.00', '2026-10-20 00:00:00', '3.0', NULL, NULL, '', '', 0, '2026-10-18 12:11:23', '2026-10-18 12:11:23');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (25, 18, NULL, 'Louvre Museum Masterpieces Guided Tour', NULL, 'sightseeing', '45.00', '2026-06-02 00:00:00', '3.0', NULL, NULL, 'Musée du Louvre', NULL, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (26, 18, NULL, 'Eiffel Tower Summit & Champagne', NULL, 'sightseeing', '85.00', '2026-06-03 00:00:00', '2.5', NULL, NULL, 'Champ de Mars', NULL, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (27, 18, NULL, 'Montmartre Secret Bakeries & Wine Walking Tour', NULL, 'food', '65.00', '2026-06-04 00:00:00', '3.0', NULL, NULL, 'Place du Tertre', NULL, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (28, 19, NULL, 'Colosseum, Roman Forum & Palatine Hill Priority Access', NULL, 'sightseeing', '75.00', '2026-06-06 00:00:00', '3.5', NULL, NULL, 'Piazza del Colosseo', NULL, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (29, 19, NULL, 'Vatican Museums, Sistine Chapel & St. Peter’s', NULL, 'sightseeing', '60.00', '2026-06-07 00:00:00', '3.5', NULL, NULL, 'Vatican City', NULL, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `activities` (`id`, `stop_id`, `activity_id`, `title`, `description`, `category`, `cost`, `scheduled_date`, `duration_hours`, `start_time`, `end_time`, `location_name`, `booking_ref`, `is_booked`, `created_at`, `updated_at`) VALUES (30, 19, NULL, 'Trastevere Sunset Pasta & Tiramisu Masterclass', NULL, 'food', '85.00', '2026-06-08 00:00:00', '3.0', NULL, NULL, 'Trastevere', NULL, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');

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
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `activities_catalog` (37 rows)
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (1, 1, 'Louvre Museum Masterpieces Guided Tour', 'sightseeing', '45.00', '3.0', 'Skip the line to see the Mona Lisa, Venus de Milo, and Winged Victory.', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (2, 1, 'Eiffel Tower Summit by Elevator & Champagne', 'sightseeing', '85.00', '2.5', 'Ascend to the highest observation deck in Paris for breathtaking panoramic views.', 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (3, 1, 'Montmartre Secret Bakeries & Wine Walking Tour', 'food', '65.00', '3.0', 'Taste artisanal baguettes, artisan cheeses, cured meats, and local wines.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (4, 1, 'Seine River Sunset Dinner Cruise', 'food', '110.00', '2.5', 'Enjoy a 3-course French dinner with live violin as Paris lights illuminate around you.', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (5, 2, 'Shibuya Crossing & Harajuku Street Fashion Walk', 'sightseeing', '25.00', '2.5', 'Experience the world’s busiest pedestrian crossing and pop-culture street fashion.', 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (6, 2, 'Tsukiji Outer Market Sushi & Street Food Safari', 'food', '55.00', '3.0', 'Savor fresh sea urchin, wagyu beef skewers, tamagoyaki, and premium nigiri sushi.', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (7, 2, 'Akihabara Retro Arcade & Electronics Tour', 'shopping', '30.00', '2.0', 'Dive into maid cafes, multi-level retro gaming centers, and hobbyist electronics.', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (8, 3, 'Ubud Sacred Monkey Forest & Tegallalang Rice Terrace', 'adventure', '35.00', '4.5', 'Wander among playful macaques in lush ancient jungle and swing over emerald rice paddies.', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (9, 3, 'Mount Batur Sunrise Volcano Hike & Hot Springs', 'adventure', '60.00', '6.0', 'Trek up an active volcano before dawn for sunrise above the clouds, followed by mineral springs.', 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (10, 3, 'Traditional Balinese Cooking Class at Organic Farm', 'food', '40.00', '3.5', 'Pick fresh herbs and cook satay lilit, gado-gado, and spicy sambal with a local family.', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (11, 4, 'Empire State Building 86th Floor Observatory', 'sightseeing', '48.00', '2.0', 'Enjoy 360-degree open-air views of Manhattan from the quintessential Art Deco skyscraper.', 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (12, 4, 'Chelsea Market & High Line Park Walking Tour', 'food', '35.00', '2.5', 'Stroll along elevated rail tracks lined with wildflowers and sample gourmet Chelsea bites.', 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (13, 4, 'Broadway Musical Evening Ticket (Lion King / Wicked)', 'other', '130.00', '3.0', 'Immerse yourself in theatrical spectacle in the heart of Times Square.', 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (14, 5, 'Colosseum, Roman Forum & Palatine Hill Priority Access', 'sightseeing', '75.00', '3.5', 'Walk through gladiatorial arenas and ancient emperor palaces with an archaeologist guide.', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=600', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (15, 5, 'Vatican Museums, Sistine Chapel & St. Peter’s Basilica', 'sightseeing', '60.00', '3.5', 'Marvel at Michelangelo’s famous ceiling and Rafael’s Renaissance frescoes.', 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (16, 5, 'Trastevere Sunset Pasta & Tiramisu Masterclass', 'food', '85.00', '3.0', 'Make fresh fettuccine and authentic Roman carbonara paired with Chianti red wine.', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (17, 6, 'Tower of London & Crown Jewels Exhibition', 'sightseeing', '38.00', '2.5', 'Discover nearly 1,000 years of royal intrigue, ravens, and dazzling crown diamonds.', 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (18, 6, 'Borough Market British Food & Craft Cider Tour', 'food', '50.00', '2.5', 'Sample Scotch eggs, artisanal Neal’s Yard cheeses, sausage rolls, and sweet fudge.', 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (19, 6, 'British Museum Ancient Egypt & Rosetta Stone Walk', 'sightseeing', '20.00', '2.0', 'Explore world history from the Parthenon sculptures to Egyptian mummies.', 'https://images.unsplash.com/photo-1568285563393-99ea48cb5695?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (20, 7, 'Sydney Opera House Behind-the-Scenes Architectural Tour', 'sightseeing', '42.00', '1.5', 'Go inside the world-famous sails and discover the engineering genius of Jørn Utzon.', 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (21, 7, 'Bondi to Coogee Coastal Clifftop Trek', 'adventure', '0.00', '3.0', 'Breathtaking 6km coastal trail passing dramatic cliffs, rock pools, and Tamarama beach.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (22, 7, 'Sydney Harbour Sunset Catamaran Cruise', 'sightseeing', '70.00', '2.0', 'Sip champagne with panoramic views of the Harbour Bridge and Opera House at dusk.', 'https://images.unsplash.com/photo-1524293581917-878a6d017c structure?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (23, 8, 'Burj Khalifa Level 124 & 125 At The Top', 'sightseeing', '52.00', '2.0', 'Stand on the observation deck of the world’s tallest skyscraper.', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (24, 8, 'Red Dune 4x4 Desert Safari with BBQ Dinner & Show', 'adventure', '75.00', '6.0', 'Thrilling sandboarding, camel rides, belly dancing show, and buffet banquet.', 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (25, 8, 'Old Dubai Souks & Abra Boat Crossing', 'shopping', '20.00', '2.5', 'Explore glittering Gold Souk, fragrant Spice Souk, and cross the Creek on traditional boat.', 'https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (26, 9, 'Sagrada Família Towers & Fast-Track Guided Tour', 'sightseeing', '55.00', '2.0', 'Witness Gaudí’s stained-glass forest and take elevators up to the Nativity towers.', 'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (27, 9, 'Park Güell Mosaic Serpent & Monumental Zone', 'sightseeing', '22.00', '2.0', 'Fairytale gardens and vibrantly tiled benches overlooking Barcelona and the sea.', 'https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (28, 9, 'Gothic Quarter Evening Tapas & Cava Crawl', 'food', '65.00', '3.0', 'Sample patatas bravas, Iberian jamón, crispy croquetas, and sparkling Catalan cava.', 'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (29, 10, 'Grand Palace & Wat Phra Kaew (Emerald Buddha)', 'sightseeing', '20.00', '3.0', 'The historic seat of the Siamese royal court, covered in golden mosaics.', 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (30, 10, 'Damnoen Saduak Floating Market & Longtail Boat', 'shopping', '35.00', '4.5', 'Glide past wooden canoes piled high with fresh mangoes, coconut pancakes, and noodles.', 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (31, 10, 'Chinatown (Yaowarat) Midnight Tuk-Tuk Food Tour', 'food', '45.00', '3.5', 'Zip through neon alleys to taste guay tiew noodles, toasted buns, and pad thai.', 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (32, 11, 'Table Mountain Cable Car & Summit Nature Trail', 'adventure', '30.00', '3.0', 'Revolving cable car ride to flat-top mountain peaks with sweeping Atlantic views.', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (33, 11, 'Cape Peninsula & Boulders Beach African Penguin Colony', 'adventure', '65.00', '7.0', 'Drive Chapman’s Peak, stand at Cape of Good Hope, and watch penguins waddle on white sands.', 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (34, 11, 'Stellenbosch Historic Wine Tasting & Cellar Tour', 'food', '70.00', '5.0', 'Sample world-renowned Pinotage and Chenin Blanc across scenic Dutch-colonial estates.', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (35, 12, 'Christ the Redeemer by Cogwheel Train through Tijuca Forest', 'sightseeing', '40.00', '3.0', 'Travel through Atlantic rainforest to the towering Art Deco statue atop Corcovado mountain.', 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (36, 12, 'Sugarloaf Mountain Cable Car at Golden Hour', 'sightseeing', '35.00', '2.5', 'Glass-walled cable car offering sunset views over Guanabara Bay and Copacabana beach.', 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `activities_catalog` (`id`, `city_id`, `name`, `category`, `estimated_cost`, `duration_hours`, `description`, `image_url`, `created_at`, `updated_at`) VALUES (37, 12, 'Samba School Night Rehearsal Experience', 'other', '45.00', '3.5', 'Feel the thunderous percussive heartbeat of Rio Carnival at a top-tier samba school.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600', '2026-10-17 22:16:46', '2026-10-17 22:16:46');

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `cities` (14 rows)
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (1, 'Paris', 'France', 'FR', 'Europe', 4, 98, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800', 'The City of Light dazzles with iconic architecture, haute cuisine, world-class art at the Louvre, and romantic Seine river cruises.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (2, 'Tokyo', 'Japan', 'JP', 'Asia', 4, 97, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800', 'An exhilarating blend of neon-lit skyscrapers and historic temples, celebrated for unmatched gastronomy, anime culture, and peaceful gardens.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (3, 'Bali', 'Indonesia', 'ID', 'Asia', 2, 95, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800', 'Island of the Gods featuring lush terraced rice paddies, volcanic peaks, sacred water temples, and world-class surfing beaches.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (4, 'New York', 'United States', 'US', 'North America', 5, 96, 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800', 'The city that never sleeps, famous for Central Park, Broadway shows, world-renowned skyline, and vibrant multicultural neighborhoods.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (5, 'Rome', 'Italy', 'IT', 'Europe', 3, 94, 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800', 'The Eternal City where ancient history comes alive through the Colosseum, Vatican City, and winding cobblestone streets filled with pasta trattorias.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (6, 'London', 'United Kingdom', 'GB', 'Europe', 5, 95, 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800', 'A global metropolis bridging royal tradition and modern creativity, from the Tower of London and West End theatres to lively riverside markets.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (7, 'Sydney', 'Australia', 'AU', 'Oceania', 4, 91, 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=800', 'Sun-drenched harbor city known for the architectural masterpiece Sydney Opera House, Bondi coastal walks, and vibrant harbor ferries.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (8, 'Dubai', 'United Arab Emirates', 'AE', 'Middle East', 5, 93, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800', 'Futuristic oasis of luxury, featuring the record-breaking Burj Khalifa, desert dune safaris, indoor ski slopes, and sprawling souks.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (9, 'Barcelona', 'Spain', 'ES', 'Europe', 3, 92, 'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=800', 'Mediterranean gem brimming with Antoni Gaudí’s surreal masterpieces like Sagrada Família, sandy city beaches, and late-night tapas bars.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (10, 'Bangkok', 'Thailand', 'TH', 'Asia', 2, 90, 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=800', 'Vibrant street life, ornate floating shrines, bustling night markets, and Michelin-starred street food stalls that never sleep.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (11, 'Cape Town', 'South Africa', 'ZA', 'Africa', 2, 88, 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=800', 'Dramatic coastal scenery flanked by Table Mountain, penguin beaches at Boulders, world-class Cape winelands, and scenic ocean drives.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (12, 'Rio de Janeiro', 'Brazil', 'BR', 'South America', 2, 89, 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800', 'Samba rhythms, golden stretches of Copacabana and Ipanema beaches, and the awe-inspiring Christ the Redeemer overlooking Sugarloaf Mountain.', '2026-10-17 22:16:45', '2026-10-17 22:16:45');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (13, 'Tiruvannamalai', 'Global Destination', 'GL', 'Global', 3, 75, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop', 'Explore Tiruvannamalai, Global Destination.', '2026-10-18 12:04:50', '2026-10-18 12:04:50');
INSERT INTO `cities` (`id`, `name`, `country`, `country_code`, `region`, `cost_index`, `popularity_score`, `image_url`, `description`, `created_at`, `updated_at`) VALUES (14, 'Pondicherry', 'India', 'IN', 'Global', 3, 75, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop', 'Explore Pondicherry, India.', '2026-10-18 12:10:26', '2026-10-18 12:10:26');

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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `packing_checklist` (21 rows)
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (1, 4, 'Passport, Schengen Visa & Health Card', 'Documents', 1, 0, '2026-10-17 22:16:46', '2026-10-17 22:43:37');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (2, 4, 'European Type-C / Type-E Plug Adapters', 'Electronics', 2, 0, '2026-10-17 22:16:46', '2026-10-17 22:43:37');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (3, 4, 'Noise-Cancelling Headphones', 'Electronics', 1, 0, '2026-10-17 22:16:46', '2026-10-17 22:43:37');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (4, 4, 'Comfortable Italian Cobblestone Walking Shoes', 'Clothing', 1, 0, '2026-10-17 22:16:46', '2026-10-17 22:43:37');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (5, 4, 'Smart Evening Outfits for Dinners', 'Clothing', 3, 0, '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (6, 4, 'Travel Umbrella & Compact Rain Jacket', 'Clothing', 1, 0, '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (7, 4, 'TSA 100ml Toiletry Kit & SPF Sunscreen', 'Toiletries', 1, 0, '2026-10-17 22:16:46', '2026-10-17 22:43:37');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (8, 4, 'Portable Power Bank (10,000 mAh)', 'Electronics', 1, 0, '2026-10-17 22:16:46', '2026-10-17 22:43:37');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (9, 4, 'Mini Travel Pharmacy & Ibuprofen', 'General', 1, 0, '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (19, 8, 'Adhar Card', 'Essentials', 1, 1, '2026-10-18 12:19:18', '2026-10-18 12:20:15');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (20, 8, 'Charger', 'Essentials', 1, 0, '2026-10-18 12:19:48', '2026-10-18 12:19:48');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (21, 8, 'Casual outfits', 'Essentials', 5, 1, '2026-10-18 12:20:05', '2026-10-18 12:20:11');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (22, 9, 'Passport, Schengen Visa & Health Card', 'Documents', 1, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (23, 9, 'European Type-C / Type-E Plug Adapters', 'Electronics', 2, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (24, 9, 'Noise-Cancelling Headphones', 'Electronics', 1, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (25, 9, 'Comfortable Italian Cobblestone Walking Shoes', 'Clothing', 1, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (26, 9, 'Smart Evening Outfits for Dinners', 'Clothing', 3, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (27, 9, 'Travel Umbrella & Compact Rain Jacket', 'Clothing', 1, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (28, 9, 'TSA 100ml Toiletry Kit & SPF Sunscreen', 'Toiletries', 1, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (29, 9, 'Portable Power Bank (10,000 mAh)', 'Electronics', 1, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `packing_checklist` (`id`, `trip_id`, `item_name`, `category`, `quantity`, `is_packed`, `created_at`, `updated_at`) VALUES (30, 9, 'Mini Travel Pharmacy & Ibuprofen', 'General', 1, 0, '2026-10-18 12:22:16', '2026-10-18 12:22:16');

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `saved_destinations` (5 rows)
INSERT INTO `saved_destinations` (`id`, `user_id`, `city_id`, `created_at`) VALUES (1, 4, 1, '2026-10-17 22:16:46');
INSERT INTO `saved_destinations` (`id`, `user_id`, `city_id`, `created_at`) VALUES (2, 4, 2, '2026-10-17 22:16:46');
INSERT INTO `saved_destinations` (`id`, `user_id`, `city_id`, `created_at`) VALUES (3, 4, 3, '2026-10-17 22:16:46');
INSERT INTO `saved_destinations` (`id`, `user_id`, `city_id`, `created_at`) VALUES (4, 8, 3, '2026-10-18 11:51:16');
INSERT INTO `saved_destinations` (`id`, `user_id`, `city_id`, `created_at`) VALUES (5, 8, 12, '2026-10-18 11:51:20');

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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `stops` (17 rows)
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (1, 2, NULL, 'Karpagam University', 'IN', NULL, NULL, '2026-07-13 00:00:00', '2026-07-15 00:00:00', 0, NULL, '2026-07-13 19:31:22', '2026-07-13 19:31:22');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (2, 2, NULL, 'Isha foundation', 'IN', NULL, NULL, '2026-07-15 00:00:00', '2026-07-15 00:00:00', 1, NULL, '2026-07-13 19:33:55', '2026-07-13 19:33:55');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (3, 2, NULL, 'Isha foundation', 'IN', NULL, NULL, '2026-07-16 00:00:00', '2026-07-16 00:00:00', 2, NULL, '2026-07-13 19:37:16', '2026-07-13 19:37:16');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (4, 2, NULL, 'Maruthamalai', 'IN', NULL, NULL, '2026-07-17 00:00:00', '2026-07-17 00:00:00', 3, NULL, '2026-07-13 19:38:19', '2026-07-13 19:38:19');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (5, 2, NULL, 'Arunachalam', 'IN', NULL, NULL, '2026-07-18 00:00:00', '2026-07-18 00:00:00', 4, NULL, '2026-07-13 19:39:04', '2026-07-13 19:39:04');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (6, 2, NULL, 'Pondicherry', NULL, NULL, NULL, '2026-07-18 00:00:00', '2026-07-18 00:00:00', 5, NULL, '2026-07-13 19:40:11', '2026-07-13 19:40:11');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (7, 3, NULL, 'Kanakadurga temple', 'IN', NULL, NULL, '2026-07-18 00:00:00', '2026-07-18 00:00:00', 0, NULL, '2026-07-13 19:57:54', '2026-07-13 19:57:54');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (8, 3, NULL, 'prakasham Barriage', 'IN', NULL, NULL, '2026-07-18 00:00:00', '2026-07-18 00:00:00', 1, NULL, '2026-07-13 19:58:37', '2026-07-13 19:58:37');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (9, 4, 1, 'Paris', 'FR', NULL, NULL, '2026-06-01 00:00:00', '2026-06-05 00:00:00', 0, 'Stay near Saint-Germain or Le Marais', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (10, 4, 5, 'Rome', 'IT', NULL, NULL, '2026-06-05 00:00:00', '2026-06-10 00:00:00', 1, 'Central hub near Piazza Navona', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (13, 6, NULL, 'indhrakiladhri', 'IN', NULL, NULL, '2026-10-17 00:00:00', '2026-10-17 00:00:00', 0, NULL, '2026-10-17 23:35:09', '2026-10-17 23:35:09');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (14, 6, NULL, 'national park', 'IN', NULL, NULL, '2026-10-18 00:00:00', '2026-10-18 00:00:00', 1, NULL, '2026-10-17 23:35:50', '2026-10-17 23:35:50');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (15, 7, 1, 'Paris', 'FR', NULL, NULL, '2026-10-18 00:00:00', '2026-10-25 00:00:00', 0, NULL, '2026-10-18 12:02:44', '2026-10-18 12:02:44');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (16, 8, 13, 'Tiruvannamalai', 'GL', NULL, NULL, '2026-10-19 00:00:00', '2026-10-19 00:00:00', 0, NULL, '2026-10-18 12:04:50', '2026-10-18 12:04:50');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (17, 8, 14, 'Pondicherry', 'IN', NULL, NULL, '2026-10-20 00:00:00', '2026-10-21 00:00:00', 1, NULL, '2026-10-18 12:10:27', '2026-10-18 12:10:27');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (18, 9, 1, 'Paris', 'FR', NULL, NULL, '2026-06-01 00:00:00', '2026-06-05 00:00:00', 0, 'Stay near Saint-Germain or Le Marais', '2026-10-18 12:22:16', '2026-10-18 12:22:16');
INSERT INTO `stops` (`id`, `trip_id`, `city_id`, `city_name`, `country_code`, `latitude`, `longitude`, `arrival_date`, `departure_date`, `order_index`, `notes`, `created_at`, `updated_at`) VALUES (19, 9, 5, 'Rome', 'IT', NULL, NULL, '2026-06-05 00:00:00', '2026-06-10 00:00:00', 1, 'Central hub near Piazza Navona', '2026-10-18 12:22:16', '2026-10-18 12:22:16');

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `trip_expenses` (7 rows)
INSERT INTO `trip_expenses` (`id`, `trip_id`, `trip_stop_id`, `category`, `amount`, `expense_date`, `notes`, `created_at`, `updated_at`) VALUES (1, 4, 9, 'Stay', '720.00', '2026-06-01 00:00:00', 'Boutique Hotel Saint-Germain (4 nights)', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `trip_expenses` (`id`, `trip_id`, `trip_stop_id`, `category`, `amount`, `expense_date`, `notes`, `created_at`, `updated_at`) VALUES (2, 4, 9, 'Meals', '65.00', '2026-06-02 00:00:00', 'Bistro Paul Bert lunch with wine', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `trip_expenses` (`id`, `trip_id`, `trip_stop_id`, `category`, `amount`, `expense_date`, `notes`, `created_at`, `updated_at`) VALUES (3, 4, 9, 'Meals', '380.00', '2026-06-03 00:00:00', 'Michelin Gala Dinner at Le Gabriel (OVER BUDGET DAY)', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `trip_expenses` (`id`, `trip_id`, `trip_stop_id`, `category`, `amount`, `expense_date`, `notes`, `created_at`, `updated_at`) VALUES (4, 4, NULL, 'Transport', '160.00', '2026-06-05 00:00:00', 'Air France flight Paris CDG to Rome FCO', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `trip_expenses` (`id`, `trip_id`, `trip_stop_id`, `category`, `amount`, `expense_date`, `notes`, `created_at`, `updated_at`) VALUES (5, 4, 10, 'Stay', '850.00', '2026-06-05 00:00:00', 'Piazza Navona Suites (5 nights)', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `trip_expenses` (`id`, `trip_id`, `trip_stop_id`, `category`, `amount`, `expense_date`, `notes`, `created_at`, `updated_at`) VALUES (6, 4, 10, 'Meals', '85.00', '2026-06-06 00:00:00', 'Osteria Da Fortunata handmade pasta & Chianti', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `trip_expenses` (`id`, `trip_id`, `trip_stop_id`, `category`, `amount`, `expense_date`, `notes`, `created_at`, `updated_at`) VALUES (7, 4, 10, 'Transport', '45.00', '2026-06-07 00:00:00', 'Rome Metro 7-day transit passes', '2026-10-17 22:16:46', '2026-10-17 22:16:46');

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `trip_notes` (4 rows)
INSERT INTO `trip_notes` (`id`, `trip_id`, `trip_stop_id`, `note_date`, `title`, `content`, `created_at`, `updated_at`) VALUES (1, 4, 9, '2026-06-01 00:00:00', 'Paris Arrival & Hotel Check-in Details', 'Door code is #4829A, then press Bell 4. Host Marie will leave the keys in the lockbox. Pick up Navigo Easy metro cards at Gare du Nord station.', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `trip_notes` (`id`, `trip_id`, `trip_stop_id`, `note_date`, `title`, `content`, `created_at`, `updated_at`) VALUES (2, 4, 9, '2026-06-03 00:00:00', 'Eiffel Tower Sunset Tips', 'Arrive at Security Gate 1 at least 45 minutes before reservation time. Bring photo ID matching booking voucher #FR-PAR-9921.', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `trip_notes` (`id`, `trip_id`, `trip_stop_id`, `note_date`, `title`, `content`, `created_at`, `updated_at`) VALUES (3, 4, 10, '2026-06-05 00:00:00', 'FCO Airport to Rome Center', 'Take the non-stop Leonardo Express train directly from Fiumicino Airport to Roma Termini (runs every 15 min, 14 EUR). Avoid unofficial street taxis.', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `trip_notes` (`id`, `trip_id`, `trip_stop_id`, `note_date`, `title`, `content`, `created_at`, `updated_at`) VALUES (4, 8, 16, '2026-10-19 00:00:00', NULL, 'yfjkbvc vjhdfbv vuvfbviyv ncxoin asvuidvvwulvw
e dsgvou md79 viurgmn fdvuydvm,v fdvoiavmf 
 svjklbds vyugff dsklfgduibfjk vkjdsl vuhvdsuhv9p ousfhfkjwrwbfuoawrfs viushkjshoisdnv.kfvbuisvk fsiuvdsmv viusd,mc mc dskjvgadsvm dskjvbslvkb s,.vniudsfds', '2026-10-18 12:21:23', '2026-10-18 12:21:23');

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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `trips` (7 rows)
INSERT INTO `trips` (`id`, `user_id`, `title`, `description`, `start_date`, `end_date`, `total_budget`, `daily_budget_threshold`, `currency`, `sharing_status`, `share_slug`, `cover_image_url`, `created_at`, `updated_at`) VALUES (2, 3, 'visiting coimbatore', 'Visiting coimbatore for Odoo Hackathon', '2026-07-13 00:00:00', '2026-07-18 00:00:00', '5000.00', '0.00', 'INR', 'private', NULL, 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=800', '2026-07-13 19:29:09', '2026-07-13 19:52:44');
INSERT INTO `trips` (`id`, `user_id`, `title`, `description`, `start_date`, `end_date`, `total_budget`, `daily_budget_threshold`, `currency`, `sharing_status`, `share_slug`, `cover_image_url`, `created_at`, `updated_at`) VALUES (3, 3, 'Trip to Vijayawada', NULL, '2026-07-18 00:00:00', '2026-07-18 00:00:00', '2000.00', '0.00', 'INR', 'public', NULL, 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800', '2026-07-13 19:57:31', '2026-07-13 19:57:31');
INSERT INTO `trips` (`id`, `user_id`, `title`, `description`, `start_date`, `end_date`, `total_budget`, `daily_budget_threshold`, `currency`, `sharing_status`, `share_slug`, `cover_image_url`, `created_at`, `updated_at`) VALUES (4, 4, 'Grand European Adventure: Paris & Rome', 'An unforgettable 10-day cultural journey across France and Italy, exploring royal palaces, world-renowned museums, and culinary treasures.', '2026-06-01 00:00:00', '2026-06-10 00:00:00', '3500.00', '350.00', 'USD', 'public', 'grand-euro-adventure-2026', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200', '2026-10-17 22:16:46', '2026-10-17 22:16:46');
INSERT INTO `trips` (`id`, `user_id`, `title`, `description`, `start_date`, `end_date`, `total_budget`, `daily_budget_threshold`, `currency`, `sharing_status`, `share_slug`, `cover_image_url`, `created_at`, `updated_at`) VALUES (6, 6, 'vijayawada', NULL, '2026-10-17 00:00:00', '2026-10-18 00:00:00', '800.00', '400.00', 'USD', 'private', 'vijayawada-5e1640', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800', '2026-10-17 23:34:23', '2026-10-17 23:34:23');
INSERT INTO `trips` (`id`, `user_id`, `title`, `description`, `start_date`, `end_date`, `total_budget`, `daily_budget_threshold`, `currency`, `sharing_status`, `share_slug`, `cover_image_url`, `created_at`, `updated_at`) VALUES (7, 8, 'Trip to Paris', 'ayesdtkbjnk,\';.\'
/lkjhgfdtxfg vbnm,,\'?130
.', '2026-10-19 00:00:00', '2026-10-24 00:00:00', '70000.00', '10000.00', 'INR', 'private', 'trip-to-paris-90b8e4', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800', '2026-10-18 11:56:19', '2026-10-18 11:56:19');
INSERT INTO `trips` (`id`, `user_id`, `title`, `description`, `start_date`, `end_date`, `total_budget`, `daily_budget_threshold`, `currency`, `sharing_status`, `share_slug`, `cover_image_url`, `created_at`, `updated_at`) VALUES (8, 8, 'Arunachalammmmm', 'Visit agni lingam, and pondicherry', '2026-10-19 00:00:00', '2026-10-21 00:00:00', '5000.00', '1000.00', 'INR', 'private', 'arunachalammmmm-e8e9cd', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800', '2026-10-18 11:59:26', '2026-10-18 11:59:26');
INSERT INTO `trips` (`id`, `user_id`, `title`, `description`, `start_date`, `end_date`, `total_budget`, `daily_budget_threshold`, `currency`, `sharing_status`, `share_slug`, `cover_image_url`, `created_at`, `updated_at`) VALUES (9, 8, 'Copy of Grand European Adventure: Paris & Rome', 'An unforgettable 10-day cultural journey across France and Italy, exploring royal palaces, world-renowned museums, and culinary treasures.', '2026-06-01 00:00:00', '2026-06-10 00:00:00', '3500.00', '350.00', 'USD', 'public', 'copy-of-grand-european-adventure-paris-r-f5934e', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200', '2026-10-18 12:22:16', '2026-10-18 12:22:36');

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

-- Dumping data for table `users` (9 rows)
INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `email`, `phone`, `city`, `country`, `bio`, `password_hash`, `avatar_url`, `language_preference`, `created_at`, `updated_at`, `role`) VALUES (1, 'Test User', NULL, NULL, 'testuser@example.com', NULL, NULL, NULL, NULL, '$2a$12$2kAA7Gy/0T./wXhAk/ViW.lKxA65g60NK25BDloWApF04GnMgAs8e', NULL, 'en', '2026-06-09 17:58:56', '2026-10-18 12:57:36', 'user');
INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `email`, `phone`, `city`, `country`, `bio`, `password_hash`, `avatar_url`, `language_preference`, `created_at`, `updated_at`, `role`) VALUES (2, 'Karthik', NULL, NULL, 'karthikbehara2005@gmail.com', NULL, NULL, NULL, NULL, '$2a$12$cGCO/aazbpHcnI2gg8LGueQasxVlscLQAOBzu68zXUqA.8d3RJwVS', NULL, 'en', '2026-06-09 18:37:44', '2026-10-18 12:57:36', 'user');
INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `email`, `phone`, `city`, `country`, `bio`, `password_hash`, `avatar_url`, `language_preference`, `created_at`, `updated_at`, `role`) VALUES (3, 'karthik', NULL, NULL, 'karthikbehara5@gmail.com', NULL, NULL, NULL, NULL, '$2a$12$MY.YcYSqi1J80kLe6sH6XOREfVUuAwBw6nDVwaaMWMadGyNUuHoRy', NULL, 'en', '2026-07-13 19:14:49', '2026-10-18 12:57:36', 'user');
INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `email`, `phone`, `city`, `country`, `bio`, `password_hash`, `avatar_url`, `language_preference`, `created_at`, `updated_at`, `role`) VALUES (4, 'Admin User', NULL, NULL, 'admin@traveloop.com', NULL, NULL, NULL, NULL, '$2a$10$Dq2n6ie7qFTRVGJAeG56verIIn1DHUTU.bCixGbHrgQd/E0zBMqD.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250', 'en', '2026-10-17 22:16:45', '2026-10-17 22:16:45', 'admin');
INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `email`, `phone`, `city`, `country`, `bio`, `password_hash`, `avatar_url`, `language_preference`, `created_at`, `updated_at`, `role`) VALUES (5, 'Demo Traveler', NULL, NULL, 'demo@traveloop.com', NULL, NULL, NULL, NULL, '$2a$12$qfzOHKaPnweRYYYRz0quWuFbMPpVN6XfkJdVsKkkrRT3ufxGCQ2rC', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250', 'en', '2026-10-17 22:16:45', '2026-10-18 12:57:36', 'user');
INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `email`, `phone`, `city`, `country`, `bio`, `password_hash`, `avatar_url`, `language_preference`, `created_at`, `updated_at`, `role`) VALUES (6, 'durjo', NULL, NULL, 'durjo@gmail.com', NULL, NULL, NULL, NULL, '$2a$12$FH.pc1DywgrIzDdV1PLFTek4.Z34rW3I7nUjZSMC7JlvD03CS7Q4a', NULL, 'en', '2026-10-17 23:32:58', '2026-10-18 12:57:36', 'user');
INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `email`, `phone`, `city`, `country`, `bio`, `password_hash`, `avatar_url`, `language_preference`, `created_at`, `updated_at`, `role`) VALUES (7, 'Durga Bhavani', 'Durga', 'Bhavani', 'db2006@gmail.com', NULL, 'Bhimavaram', 'India', NULL, '$2a$12$8ieurlFDRcBwkhGN3evFs.O0Do4EwUxkUY7OQBU8Yo6XdenPwnRIe', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300', 'en', '2026-10-18 10:22:20', '2026-10-18 10:22:20', 'user');
INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `email`, `phone`, `city`, `country`, `bio`, `password_hash`, `avatar_url`, `language_preference`, `created_at`, `updated_at`, `role`) VALUES (8, 'sandhya behara', 'sandhya', 'behara', 'sandhyabehara@gmail.com', '9881234567', 'West Godavari', 'India', 'A travell vlogger travells across india', '$2a$12$Drk7N5FZ6org00CQ65f/9eQMh.9//h5LCjli/NaQIP5BCZkA8BI7O', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300', 'en', '2026-10-18 11:35:55', '2026-10-18 11:35:55', 'user');
INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `email`, `phone`, `city`, `country`, `bio`, `password_hash`, `avatar_url`, `language_preference`, `created_at`, `updated_at`, `role`) VALUES (9, 'Karthik Behara', 'Karthik', 'Behara', 'karthikb@gmail.com', '9346148347', 'Palacoderu', 'India', NULL, '$2a$12$ecbO.b3k9FtbFblpHEmx6ewINVuOwzDKIFkPzEbBhitQ6md.V8JG2', 'data:image/jpeg;base64,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', 'en', '2026-10-18 16:48:42', '2026-10-18 16:48:42', 'user');

SET FOREIGN_KEY_CHECKS = 1;
-- Backup Completed Successfully.
