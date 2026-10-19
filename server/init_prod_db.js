require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function initProdDb() {
  console.log('[Cloud DB Init] Initializing production database...');

  const connection = await mysql.createConnection({
    host:               process.env.DB_HOST     || 'localhost',
    port:               Number(process.env.DB_PORT) || 3306,
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'odoo_hackathon',
    multipleStatements: true,
    ...(process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true'
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
  });

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    // ── 1. Create All 11 Core Tables (IF NOT EXISTS) ───────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                  INT UNSIGNED      NOT NULL AUTO_INCREMENT,
        name                VARCHAR(120)      NOT NULL,
        first_name          VARCHAR(100)          NULL DEFAULT NULL,
        last_name           VARCHAR(100)          NULL DEFAULT NULL,
        email               VARCHAR(255)      NOT NULL,
        role                ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        password_hash       VARCHAR(255)      NOT NULL,
        phone               VARCHAR(50)           NULL DEFAULT NULL,
        city                VARCHAR(100)          NULL DEFAULT NULL,
        country             VARCHAR(100)          NULL DEFAULT NULL,
        bio                 TEXT                  NULL DEFAULT NULL,
        avatar_url          VARCHAR(512)          NULL DEFAULT NULL,
        language_preference VARCHAR(10)       NOT NULL DEFAULT 'en',
        created_at          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email (email),
        KEY idx_users_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS cities (
        id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
        name             VARCHAR(150)     NOT NULL,
        country          VARCHAR(100)     NOT NULL,
        country_code     CHAR(2)              NULL DEFAULT NULL,
        region           VARCHAR(100)         NULL DEFAULT 'Global',
        cost_index       TINYINT UNSIGNED NOT NULL DEFAULT 3,
        popularity_score TINYINT UNSIGNED NOT NULL DEFAULT 80,
        image_url        VARCHAR(512)         NULL DEFAULT NULL,
        description      TEXT                 NULL DEFAULT NULL,
        created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_cities_name_country (name, country),
        KEY idx_cities_region (region),
        KEY idx_cities_popularity (popularity_score)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS saved_destinations (
        id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id    INT UNSIGNED NOT NULL,
        city_id    INT UNSIGNED NOT NULL,
        created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_user_city (user_id, city_id),
        CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_saved_city FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
        updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_act_cat_city FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE CASCADE ON UPDATE CASCADE,
        KEY idx_act_city (city_id),
        KEY idx_act_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
        updated_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_trips_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        KEY idx_trips_user_id (user_id),
        KEY idx_trips_sharing (sharing_status),
        KEY idx_trips_slug (share_slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
        updated_at     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_stops_trip FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_stops_city FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE SET NULL ON UPDATE CASCADE,
        KEY idx_stops_trip_order (trip_id, order_index)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS activities (
        id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
        stop_id        INT UNSIGNED   NOT NULL,
        activity_id    INT UNSIGNED       NULL DEFAULT NULL,
        title          VARCHAR(200)   NOT NULL,
        description    TEXT               NULL DEFAULT NULL,
        category       ENUM('sightseeing','food','transport','accommodation','adventure','shopping','other') NOT NULL DEFAULT 'other',
        cost           DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
        scheduled_date DATE               NULL DEFAULT NULL,
        duration_hours DECIMAL(4,1)   NOT NULL DEFAULT 1.0,
        start_time     DATETIME           NULL DEFAULT NULL,
        end_time       DATETIME           NULL DEFAULT NULL,
        location_name  VARCHAR(200)       NULL DEFAULT NULL,
        booking_ref    VARCHAR(100)       NULL DEFAULT NULL,
        is_booked      TINYINT(1)     NOT NULL DEFAULT 0,
        created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_activities_stop FOREIGN KEY (stop_id) REFERENCES stops (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_act_catalog FOREIGN KEY (activity_id) REFERENCES activities_catalog (id) ON DELETE SET NULL ON UPDATE CASCADE,
        KEY idx_activities_stop (stop_id),
        KEY idx_activities_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS trip_collaborators (
        id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
        trip_id    INT UNSIGNED NOT NULL,
        user_id    INT UNSIGNED NOT NULL,
        role       ENUM('viewer','editor') NOT NULL DEFAULT 'viewer',
        invited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_trip_collaborator (trip_id, user_id),
        KEY fk_collaborators_user (user_id),
        CONSTRAINT fk_collaborators_trip FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_collaborators_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS trip_expenses (
        id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        trip_id      INT UNSIGNED  NOT NULL,
        trip_stop_id INT UNSIGNED      NULL DEFAULT NULL,
        category     ENUM('Transport','Stay','Activities','Meals','Other') NOT NULL DEFAULT 'Other',
        amount       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        expense_date DATE              NULL DEFAULT NULL,
        notes        VARCHAR(255)      NULL DEFAULT NULL,
        created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_expenses_trip FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_expenses_stop FOREIGN KEY (trip_stop_id) REFERENCES stops (id) ON DELETE SET NULL ON UPDATE CASCADE,
        KEY idx_expenses_trip (trip_id),
        KEY idx_expenses_category (category),
        KEY idx_expenses_date (expense_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS packing_checklist (
        id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
        trip_id    INT UNSIGNED      NOT NULL,
        item_name  VARCHAR(150)      NOT NULL,
        category   VARCHAR(80)           NULL DEFAULT 'General',
        quantity   SMALLINT UNSIGNED NOT NULL DEFAULT 1,
        is_packed  TINYINT(1)        NOT NULL DEFAULT 0,
        created_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_checklist_trip FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE ON UPDATE CASCADE,
        KEY idx_checklist_trip (trip_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS trip_notes (
        id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
        trip_id      INT UNSIGNED NOT NULL,
        trip_stop_id INT UNSIGNED     NULL DEFAULT NULL,
        note_date    DATE             NULL DEFAULT NULL,
        title        VARCHAR(200)     NULL DEFAULT NULL,
        content      TEXT         NOT NULL,
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_notes_trip FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_notes_stop FOREIGN KEY (trip_stop_id) REFERENCES stops (id) ON DELETE SET NULL ON UPDATE CASCADE,
        KEY idx_notes_trip (trip_id),
        KEY idx_notes_stop (trip_stop_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ── 2. Helper column checks (for backward-compatible databases) ─
    async function columnExists(table, column) {
      const [rows] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [process.env.DB_NAME || 'odoo_hackathon', table, column]
      );
      return rows.length > 0;
    }

    if (!await columnExists('users', 'role')) {
      await connection.query("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER email");
    }
    if (!await columnExists('users', 'first_name')) {
      await connection.query("ALTER TABLE users ADD COLUMN first_name VARCHAR(100) NULL DEFAULT NULL AFTER name");
    }
    if (!await columnExists('users', 'last_name')) {
      await connection.query("ALTER TABLE users ADD COLUMN last_name VARCHAR(100) NULL DEFAULT NULL AFTER first_name");
    }
    if (!await columnExists('users', 'phone')) {
      await connection.query("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL DEFAULT NULL AFTER email");
    }
    if (!await columnExists('users', 'city')) {
      await connection.query("ALTER TABLE users ADD COLUMN city VARCHAR(100) NULL DEFAULT NULL AFTER phone");
    }
    if (!await columnExists('users', 'country')) {
      await connection.query("ALTER TABLE users ADD COLUMN country VARCHAR(100) NULL DEFAULT NULL AFTER city");
    }
    if (!await columnExists('users', 'bio')) {
      await connection.query("ALTER TABLE users ADD COLUMN bio TEXT NULL DEFAULT NULL AFTER country");
    }

    // ── 3. Guarantee Master Administrator Account ─────────────
    const [adminCheck] = await connection.query(
      "SELECT id, role FROM users WHERE email = 'admin@traveloop.com' LIMIT 1"
    );

    if (adminCheck.length === 0) {
      console.log('  + Creating default master administrator (admin@traveloop.com)...');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      await connection.query(
        `INSERT INTO users (name, first_name, last_name, email, role, password_hash, language_preference)
         VALUES ('Traveloop Administrator', 'Admin', 'Traveloop', 'admin@traveloop.com', 'admin', ?, 'en')`,
        [hashedPassword]
      );
      console.log('  ✓ Master administrator created: admin@traveloop.com / Admin@123');
    } else if (adminCheck[0].role !== 'admin') {
      await connection.query(
        "UPDATE users SET role = 'admin' WHERE email = 'admin@traveloop.com'"
      );
      console.log('  ✓ Upgraded admin@traveloop.com to role = admin');
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('[Cloud DB Init] All 11 tables and Admin user verified successfully.');
  } catch (err) {
    console.error('[Cloud DB Init] Error during database initialization:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

// Run directly if invoked from command line
if (require.main === module) {
  initProdDb()
    .then(() => {
      console.log('[Cloud DB Init] Ready for server boot.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Cloud DB Init] Fatal startup initialization error:', err);
      process.exit(1);
    });
}

module.exports = initProdDb;
