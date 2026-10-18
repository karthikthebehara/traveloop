require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  console.log('🔄 Starting Traveloop Database Migration...');

  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     process.env.DB_PORT || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'odoo_hackathon',
    multipleStatements: true,
  });

  try {
    // Helper to check if column exists
    async function columnExists(table, column) {
      const [rows] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [process.env.DB_NAME || 'odoo_hackathon', table, column]
      );
      return rows.length > 0;
    }

    // Helper to check if table exists
    async function tableExists(table) {
      const [rows] = await connection.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [process.env.DB_NAME || 'odoo_hackathon', table]
      );
      return rows.length > 0;
    }

    console.log('1. Checking & updating users table...');
    if (await tableExists('users')) {
      if (!await columnExists('users', 'role')) {
        await connection.query(`ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER email`);
        console.log('  + Added role column to users');
      }
      if (!await columnExists('users', 'language_preference')) {
        await connection.query(`ALTER TABLE users ADD COLUMN language_preference VARCHAR(10) NOT NULL DEFAULT 'en' AFTER avatar_url`);
        console.log('  + Added language_preference column to users');
      }
      if (!await columnExists('users', 'first_name')) {
        await connection.query(`ALTER TABLE users ADD COLUMN first_name VARCHAR(100) NULL DEFAULT NULL AFTER name`);
        console.log('  + Added first_name column to users');
      }
      if (!await columnExists('users', 'last_name')) {
        await connection.query(`ALTER TABLE users ADD COLUMN last_name VARCHAR(100) NULL DEFAULT NULL AFTER first_name`);
        console.log('  + Added last_name column to users');
      }
      if (!await columnExists('users', 'phone')) {
        await connection.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL DEFAULT NULL AFTER email`);
        console.log('  + Added phone column to users');
      }
      if (!await columnExists('users', 'city')) {
        await connection.query(`ALTER TABLE users ADD COLUMN city VARCHAR(100) NULL DEFAULT NULL AFTER phone`);
        console.log('  + Added city column to users');
      }
      if (!await columnExists('users', 'country')) {
        await connection.query(`ALTER TABLE users ADD COLUMN country VARCHAR(100) NULL DEFAULT NULL AFTER city`);
        console.log('  + Added country column to users');
      }
      if (!await columnExists('users', 'bio')) {
        await connection.query(`ALTER TABLE users ADD COLUMN bio TEXT NULL DEFAULT NULL AFTER country`);
        console.log('  + Added bio column to users');
      }
    }

    console.log('2. Creating cities catalog table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name             VARCHAR(150) NOT NULL,
        country          VARCHAR(100) NOT NULL,
        country_code     CHAR(2)          NULL DEFAULT NULL,
        region           VARCHAR(100)     NULL DEFAULT 'Global',
        cost_index       TINYINT UNSIGNED NOT NULL DEFAULT 3,  -- 1 (Budget) to 5 (Luxury)
        popularity_score TINYINT UNSIGNED NOT NULL DEFAULT 80, -- 1 to 100
        image_url        VARCHAR(512)     NULL DEFAULT NULL,
        description      TEXT             NULL DEFAULT NULL,
        created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_cities_name_country (name, country),
        KEY idx_cities_region (region),
        KEY idx_cities_popularity (popularity_score)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ cities table ready');

    console.log('3. Creating saved_destinations table...');
    await connection.query(`
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
    `);
    console.log('  ✓ saved_destinations table ready');

    console.log('4. Creating activities_catalog table...');
    await connection.query(`
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
    `);
    console.log('  ✓ activities_catalog table ready');

    console.log('5. Updating trips table...');
    if (await tableExists('trips')) {
      if (!await columnExists('trips', 'daily_budget_threshold')) {
        await connection.query(`ALTER TABLE trips ADD COLUMN daily_budget_threshold DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER total_budget`);
        console.log('  + Added daily_budget_threshold to trips');
      }
      if (!await columnExists('trips', 'share_slug')) {
        await connection.query(`ALTER TABLE trips ADD COLUMN share_slug VARCHAR(100) NULL DEFAULT NULL AFTER sharing_status`);
        console.log('  + Added share_slug to trips');
      }
    }

    console.log('6. Updating stops table...');
    if (await tableExists('stops')) {
      if (!await columnExists('stops', 'city_id')) {
        await connection.query(`ALTER TABLE stops ADD COLUMN city_id INT UNSIGNED NULL DEFAULT NULL AFTER trip_id`);
        console.log('  + Added city_id to stops');
        // Add foreign key constraint if possible
        try {
          await connection.query(`ALTER TABLE stops ADD CONSTRAINT fk_stops_city FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE SET NULL ON UPDATE CASCADE`);
        } catch (e) {
          // ignore if already added
        }
      }
    }

    console.log('7. Updating activities table...');
    if (await tableExists('activities')) {
      if (!await columnExists('activities', 'activity_id')) {
        await connection.query(`ALTER TABLE activities ADD COLUMN activity_id INT UNSIGNED NULL DEFAULT NULL AFTER stop_id`);
        console.log('  + Added activity_id to activities');
        try {
          await connection.query(`ALTER TABLE activities ADD CONSTRAINT fk_act_catalog FOREIGN KEY (activity_id) REFERENCES activities_catalog (id) ON DELETE SET NULL ON UPDATE CASCADE`);
        } catch (e) {}
      }
      if (!await columnExists('activities', 'duration_hours')) {
        await connection.query(`ALTER TABLE activities ADD COLUMN duration_hours DECIMAL(4,1) NOT NULL DEFAULT 1.0 AFTER cost`);
        console.log('  + Added duration_hours to activities');
      }
      if (!await columnExists('activities', 'scheduled_date')) {
        await connection.query(`ALTER TABLE activities ADD COLUMN scheduled_date DATE NULL DEFAULT NULL AFTER cost`);
        console.log('  + Added scheduled_date to activities');
      }
    }

    console.log('8. Creating trip_expenses table...');
    await connection.query(`
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
    `);
    console.log('  ✓ trip_expenses table ready');

    console.log('9. Updating trip_notes table...');
    if (await tableExists('trip_notes')) {
      if (!await columnExists('trip_notes', 'trip_stop_id')) {
        await connection.query(`ALTER TABLE trip_notes ADD COLUMN trip_stop_id INT UNSIGNED NULL DEFAULT NULL AFTER trip_id`);
        console.log('  + Added trip_stop_id to trip_notes');
        try {
          await connection.query(`ALTER TABLE trip_notes ADD CONSTRAINT fk_notes_stop FOREIGN KEY (trip_stop_id) REFERENCES stops (id) ON DELETE SET NULL ON UPDATE CASCADE`);
        } catch (e) {}
      }
      if (!await columnExists('trip_notes', 'note_date')) {
        await connection.query(`ALTER TABLE trip_notes ADD COLUMN note_date DATE NULL DEFAULT NULL AFTER trip_stop_id`);
        console.log('  + Added note_date to trip_notes');
      }
    }

    console.log('10. Elevating all existing users to admin role for immediate testing...');
    await connection.query(`UPDATE users SET role = 'admin' WHERE role = 'user' OR role IS NULL`);
    console.log('  ✓ Existing users updated to role = admin');

    console.log('\n🎉 ALL 10 TABLES & COLUMNS SUCCESSFULLY MIGRATED!');
  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
