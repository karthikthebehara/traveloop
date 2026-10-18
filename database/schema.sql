-- =============================================================
--  Traveloop — MySQL Database Schema (Master Specification)
--  Project : Odoo KAHE Hackathon | Team The Invictus
--  Updated : Complete 10 Tables Schema with Foreign Keys
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------
-- 1. USERS
--    Core authentication table with role & language preferences
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    name                VARCHAR(120)      NOT NULL,
    email               VARCHAR(255)      NOT NULL,
    role                ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    password_hash       VARCHAR(255)      NOT NULL,
    avatar_url          VARCHAR(512)          NULL DEFAULT NULL,
    language_preference VARCHAR(10)       NOT NULL DEFAULT 'en',
    created_at          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 2. CITIES (Global Destinations Catalog)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cities (
    id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    name             VARCHAR(150)     NOT NULL,
    country          VARCHAR(100)     NOT NULL,
    country_code     CHAR(2)              NULL DEFAULT NULL,
    region           VARCHAR(100)         NULL DEFAULT 'Global',
    cost_index       TINYINT UNSIGNED NOT NULL DEFAULT 3,  -- 1 (Budget) to 5 (Luxury)
    popularity_score TINYINT UNSIGNED NOT NULL DEFAULT 80, -- 1 to 100
    image_url        VARCHAR(512)         NULL DEFAULT NULL,
    description      TEXT                 NULL DEFAULT NULL,
    created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                               ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_cities_name_country (name, country),
    KEY idx_cities_region (region),
    KEY idx_cities_popularity (popularity_score)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 3. SAVED DESTINATIONS (User Bookmarks)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_destinations (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    city_id    INT UNSIGNED NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_user_city (user_id, city_id),
    CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_saved_city FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 4. ACTIVITIES CATALOG (Global Catalog of Things To Do)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities_catalog (
    id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    city_id        INT UNSIGNED  NOT NULL,
    name           VARCHAR(200)  NOT NULL,
    category       ENUM('sightseeing','food','transport','accommodation','adventure','shopping','other') NOT NULL DEFAULT 'sightseeing',
    estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    duration_hours DECIMAL(4,1)  NOT NULL DEFAULT 2.0,
    description    TEXT              NULL DEFAULT NULL,
    image_url      VARCHAR(512)      NULL DEFAULT NULL,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_act_cat_city FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE CASCADE ON UPDATE CASCADE,
    KEY idx_act_city (city_id),
    KEY idx_act_category (category)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 5. TRIPS (Master Record for Multi-City Itineraries)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
    id                      INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    user_id                 INT UNSIGNED        NOT NULL,
    title                   VARCHAR(200)        NOT NULL,
    description             TEXT                    NULL DEFAULT NULL,
    start_date              DATE                    NULL DEFAULT NULL,
    end_date                DATE                    NULL DEFAULT NULL,
    total_budget            DECIMAL(10,2)       NOT NULL DEFAULT 0.00,
    daily_budget_threshold  DECIMAL(10,2)       NOT NULL DEFAULT 0.00,
    currency                CHAR(3)             NOT NULL DEFAULT 'USD',
    sharing_status          ENUM('private','shared','public') NOT NULL DEFAULT 'private',
    share_slug              VARCHAR(100)            NULL DEFAULT NULL,
    cover_image_url         VARCHAR(512)            NULL DEFAULT NULL,
    created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                         ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_trips_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    KEY idx_trips_user_id (user_id),
    KEY idx_trips_sharing (sharing_status),
    KEY idx_trips_slug    (share_slug)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 6. TRIP STOPS (Destinations in a Trip)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stops (
    id             INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    trip_id        INT UNSIGNED      NOT NULL,
    city_id        INT UNSIGNED          NULL DEFAULT NULL,
    city_name      VARCHAR(150)      NOT NULL,
    country_code   CHAR(2)               NULL DEFAULT NULL,
    latitude       DECIMAL(9,6)          NULL DEFAULT NULL,
    longitude      DECIMAL(9,6)          NULL DEFAULT NULL,
    arrival_date   DATE                  NULL DEFAULT NULL,
    departure_date DATE                  NULL DEFAULT NULL,
    order_index    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    notes          TEXT                  NULL DEFAULT NULL,
    created_at     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP
                                              ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_stops_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_stops_city
        FOREIGN KEY (city_id) REFERENCES cities (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    KEY idx_stops_trip_order (trip_id, order_index)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 7. STOP ACTIVITIES (Scheduled Activities in a Stop)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    stop_id        INT UNSIGNED   NOT NULL,
    activity_id    INT UNSIGNED       NULL DEFAULT NULL,
    title          VARCHAR(200)   NOT NULL,
    description    TEXT               NULL DEFAULT NULL,
    category       ENUM(
                     'sightseeing',
                     'food',
                     'transport',
                     'accommodation',
                     'adventure',
                     'shopping',
                     'other'
                   )              NOT NULL DEFAULT 'other',
    cost           DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    scheduled_date DATE               NULL DEFAULT NULL,
    duration_hours DECIMAL(4,1)   NOT NULL DEFAULT 1.0,
    start_time     DATETIME           NULL DEFAULT NULL,
    end_time       DATETIME           NULL DEFAULT NULL,
    location_name  VARCHAR(200)       NULL DEFAULT NULL,
    booking_ref    VARCHAR(100)       NULL DEFAULT NULL,
    is_booked      TINYINT(1)     NOT NULL DEFAULT 0,
    created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_activities_stop
        FOREIGN KEY (stop_id) REFERENCES stops (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_act_catalog
        FOREIGN KEY (activity_id) REFERENCES activities_catalog (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    KEY idx_activities_stop     (stop_id),
    KEY idx_activities_category (category)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 8. TRIP EXPENSES (Financial Logs: Transport, Stay, Activities, Meals)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trip_expenses (
    id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    trip_id      INT UNSIGNED  NOT NULL,
    trip_stop_id INT UNSIGNED      NULL DEFAULT NULL,
    category     ENUM('Transport','Stay','Activities','Meals','Other') NOT NULL DEFAULT 'Other',
    amount       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    expense_date DATE              NULL DEFAULT NULL,
    notes        VARCHAR(255)      NULL DEFAULT NULL,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_expenses_trip FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_expenses_stop FOREIGN KEY (trip_stop_id) REFERENCES stops (id) ON DELETE SET NULL ON UPDATE CASCADE,
    KEY idx_expenses_trip (trip_id),
    KEY idx_expenses_category (category),
    KEY idx_expenses_date (expense_date)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 9. PACKING CHECKLIST
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packing_checklist (
    id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    trip_id    INT UNSIGNED      NOT NULL,
    item_name  VARCHAR(150)      NOT NULL,
    category   VARCHAR(80)           NULL DEFAULT 'General',
    quantity   SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    is_packed  TINYINT(1)        NOT NULL DEFAULT 0,
    created_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_checklist_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    KEY idx_checklist_trip (trip_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 10. TRIP NOTES / JOURNAL
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trip_notes (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    trip_id      INT UNSIGNED NOT NULL,
    trip_stop_id INT UNSIGNED     NULL DEFAULT NULL,
    note_date    DATE             NULL DEFAULT NULL,
    title        VARCHAR(200)     NULL DEFAULT NULL,
    content      TEXT         NOT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_notes_trip FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notes_stop FOREIGN KEY (trip_stop_id) REFERENCES stops (id) ON DELETE SET NULL ON UPDATE CASCADE,
    KEY idx_notes_trip (trip_id),
    KEY idx_notes_stop (trip_stop_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
