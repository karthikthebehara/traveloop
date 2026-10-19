const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

/**
 * Startup Bootstrap for Traveloop Database
 *
 * Automatically executed on backend startup:
 * 1. Creates all 11 core tables if they do not exist
 * 2. Migrates missing columns (role, first/last name, phone, bio, avatar_url LONGTEXT, etc.)
 * 3. Guarantees master admin exists with role='admin' & password='Admin@123'
 * 4. Seeds 12 global cities and 36 activities catalog if cities table is empty
 */
async function bootstrapDatabase() {
  console.log('[Bootstrap DB] Verifying and initializing database schema...');

  const connection = await pool.getConnection();

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    // ── 1. Create Core Tables (Executed individually for maximum driver compatibility) ──
    const tableQueries = [
      `CREATE TABLE IF NOT EXISTS users (
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
        avatar_url          LONGTEXT              NULL DEFAULT NULL,
        language_preference VARCHAR(10)       NOT NULL DEFAULT 'en',
        created_at          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email (email),
        KEY idx_users_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS cities (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS saved_destinations (
        id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id    INT UNSIGNED NOT NULL,
        city_id    INT UNSIGNED NOT NULL,
        created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_user_city (user_id, city_id),
        CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_saved_city FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS activities_catalog (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS trips (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS stops (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS activities (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS trip_collaborators (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS trip_expenses (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS packing_checklist (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS trip_notes (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    ];

    for (const sql of tableQueries) {
      await connection.query(sql);
    }

    // ── 2. Safe Schema Migration Check Helper ─────────────────
    async function columnExists(table, column) {
      try {
        const [rows] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [table, column]
        );
        return rows.length > 0;
      } catch (err) {
        return false;
      }
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
    if (!await columnExists('users', 'language_preference')) {
      await connection.query("ALTER TABLE users ADD COLUMN language_preference VARCHAR(10) NOT NULL DEFAULT 'en'");
    }

    // Ensure avatar_url is LONGTEXT so base64 uploads never fail
    try {
      await connection.query("ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL DEFAULT NULL");
    } catch (e) {
      // Ignore if already longtext or not permissible
    }

    // ── 3. Guarantee Master Administrator Account ─────────────
    const salt = await bcrypt.genSalt(12);
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);

    const [adminCheck] = await connection.query(
      "SELECT id, role FROM users WHERE email = 'admin@traveloop.com' LIMIT 1"
    );

    if (adminCheck.length === 0) {
      await connection.query(
        `INSERT INTO users (name, first_name, last_name, email, role, password_hash, language_preference)
         VALUES ('Traveloop Administrator', 'Admin', 'Traveloop', 'admin@traveloop.com', 'admin', ?, 'en')`,
        [adminPasswordHash]
      );
      console.log('[Bootstrap DB] Master administrator created: admin@traveloop.com / Admin@123');
    } else {
      // Force update role and password hash so Admin@123 is 100% guaranteed to authenticate
      await connection.query(
        "UPDATE users SET role = 'admin', password_hash = ? WHERE email = 'admin@traveloop.com'",
        [adminPasswordHash]
      );
      console.log('[Bootstrap DB] Master administrator credentials verified (admin@traveloop.com)');
    }

    // ── 4. Auto-Seed Global Cities & Activities if Empty ──────
    const [cityCountRows] = await connection.query('SELECT COUNT(*) AS count FROM cities');
    const cityCount = cityCountRows[0].count;

    if (cityCount === 0) {
      console.log('[Bootstrap DB] Cities table empty. Seeding 12 destinations and 36 catalog activities...');
      
      const citiesData = [
        { name: 'Paris', country: 'France', country_code: 'FR', region: 'Europe', cost_index: 4, popularity_score: 98, image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800', description: 'The City of Light dazzles with iconic architecture, haute cuisine, world-class art at the Louvre, and romantic Seine river cruises.' },
        { name: 'Tokyo', country: 'Japan', country_code: 'JP', region: 'Asia', cost_index: 4, popularity_score: 97, image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800', description: 'An exhilarating blend of neon-lit skyscrapers and historic temples, celebrated for unmatched gastronomy, anime culture, and peaceful gardens.' },
        { name: 'Bali', country: 'Indonesia', country_code: 'ID', region: 'Asia', cost_index: 2, popularity_score: 95, image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800', description: 'Island of the Gods featuring lush terraced rice paddies, volcanic peaks, sacred water temples, and world-class surfing beaches.' },
        { name: 'New York', country: 'United States', country_code: 'US', region: 'North America', cost_index: 5, popularity_score: 96, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800', description: 'The city that never sleeps, famous for Central Park, Broadway shows, world-renowned skyline, and vibrant multicultural neighborhoods.' },
        { name: 'Rome', country: 'Italy', country_code: 'IT', region: 'Europe', cost_index: 3, popularity_score: 94, image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800', description: 'The Eternal City where ancient history comes alive through the Colosseum, Vatican City, and winding cobblestone streets filled with pasta trattorias.' },
        { name: 'London', country: 'United Kingdom', country_code: 'GB', region: 'Europe', cost_index: 5, popularity_score: 95, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800', description: 'A global metropolis bridging royal tradition and modern creativity, from the Tower of London and West End theatres to lively riverside markets.' },
        { name: 'Sydney', country: 'Australia', country_code: 'AU', region: 'Oceania', cost_index: 4, popularity_score: 91, image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=800', description: 'Sun-drenched harbor city known for the architectural masterpiece Sydney Opera House, Bondi coastal walks, and vibrant harbor ferries.' },
        { name: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', region: 'Middle East', cost_index: 5, popularity_score: 93, image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800', description: 'Futuristic oasis of luxury, featuring the record-breaking Burj Khalifa, desert dune safaris, indoor ski slopes, and sprawling souks.' },
        { name: 'Barcelona', country: 'Spain', country_code: 'ES', region: 'Europe', cost_index: 3, popularity_score: 92, image_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=800', description: 'Mediterranean gem brimming with Antoni Gaudí’s surreal masterpieces like Sagrada Família, sandy city beaches, and late-night tapas bars.' },
        { name: 'Bangkok', country: 'Thailand', country_code: 'TH', region: 'Asia', cost_index: 2, popularity_score: 90, image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=800', description: 'Vibrant street life, ornate floating shrines, bustling night markets, and Michelin-starred street food stalls that never sleep.' },
        { name: 'Cape Town', country: 'South Africa', country_code: 'ZA', region: 'Africa', cost_index: 2, popularity_score: 88, image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=800', description: 'Dramatic coastal scenery flanked by Table Mountain, penguin beaches at Boulders, world-class Cape winelands, and scenic ocean drives.' },
        { name: 'Rio de Janeiro', country: 'Brazil', country_code: 'BR', region: 'South America', cost_index: 2, popularity_score: 89, image_url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800', description: 'Samba rhythms, golden stretches of Copacabana and Ipanema beaches, and the awe-inspiring Christ the Redeemer overlooking Sugarloaf Mountain.' },
      ];

      const cityIdMap = {};
      for (const c of citiesData) {
        await connection.execute(`
          INSERT INTO cities (name, country, country_code, region, cost_index, popularity_score, image_url, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            country_code = VALUES(country_code),
            region = VALUES(region),
            cost_index = VALUES(cost_index),
            popularity_score = VALUES(popularity_score),
            image_url = VALUES(image_url),
            description = VALUES(description)
        `, [c.name, c.country, c.country_code, c.region, c.cost_index, c.popularity_score, c.image_url, c.description]);

        const [r] = await connection.execute(`SELECT id FROM cities WHERE name = ? AND country = ? LIMIT 1`, [c.name, c.country]);
        cityIdMap[c.name] = r[0].id;
      }

      const catalogData = [
        // Paris
        { city: 'Paris', name: 'Louvre Museum Masterpieces Guided Tour', category: 'sightseeing', cost: 45.00, duration: 3.0, desc: 'Skip the line to see the Mona Lisa, Venus de Milo, and Winged Victory.', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=600' },
        { city: 'Paris', name: 'Eiffel Tower Summit by Elevator & Champagne', category: 'sightseeing', cost: 85.00, duration: 2.5, desc: 'Ascend to the highest observation deck in Paris for breathtaking panoramic views.', img: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?q=80&w=600' },
        { city: 'Paris', name: 'Montmartre Secret Bakeries & Wine Walking Tour', category: 'food', cost: 65.00, duration: 3.0, desc: 'Taste artisanal baguettes, artisan cheeses, cured meats, and local wines.', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600' },
        { city: 'Paris', name: 'Seine River Sunset Dinner Cruise', category: 'food', cost: 110.00, duration: 2.5, desc: 'Enjoy a 3-course French dinner with live violin as Paris lights illuminate around you.', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600' },

        // Tokyo
        { city: 'Tokyo', name: 'Shibuya Crossing & Harajuku Street Fashion Walk', category: 'sightseeing', cost: 25.00, duration: 2.5, desc: 'Experience the world’s busiest pedestrian crossing and pop-culture street fashion.', img: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=600' },
        { city: 'Tokyo', name: 'Tsukiji Outer Market Sushi & Street Food Safari', category: 'food', cost: 55.00, duration: 3.0, desc: 'Savor fresh sea urchin, wagyu beef skewers, tamagoyaki, and premium nigiri sushi.', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600' },
        { city: 'Tokyo', name: 'Akihabara Retro Arcade & Electronics Tour', category: 'shopping', cost: 30.00, duration: 2.0, desc: 'Dive into maid cafes, multi-level retro gaming centers, and hobbyist electronics.', img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600' },

        // Bali
        { city: 'Bali', name: 'Ubud Sacred Monkey Forest & Tegallalang Rice Terrace', category: 'adventure', cost: 35.00, duration: 4.5, desc: 'Wander among playful macaques in lush ancient jungle and swing over emerald rice paddies.', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600' },
        { city: 'Bali', name: 'Mount Batur Sunrise Volcano Hike & Hot Springs', category: 'adventure', cost: 60.00, duration: 6.0, desc: 'Trek up an active volcano before dawn for sunrise above the clouds, followed by mineral springs.', img: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=600' },
        { city: 'Bali', name: 'Traditional Balinese Cooking Class at Organic Farm', category: 'food', cost: 40.00, duration: 3.5, desc: 'Pick fresh herbs and cook satay lilit, gado-gado, and spicy sambal with a local family.', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600' },

        // New York
        { city: 'New York', name: 'Empire State Building 86th Floor Observatory', category: 'sightseeing', cost: 48.00, duration: 2.0, desc: 'Enjoy 360-degree open-air views of Manhattan from the quintessential Art Deco skyscraper.', img: 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?q=80&w=600' },
        { city: 'New York', name: 'Chelsea Market & High Line Park Walking Tour', category: 'food', cost: 35.00, duration: 2.5, desc: 'Stroll along elevated rail tracks lined with wildflowers and sample gourmet Chelsea bites.', img: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=600' },
        { city: 'New York', name: 'Broadway Musical Evening Ticket (Lion King / Wicked)', category: 'other', cost: 130.00, duration: 3.0, desc: 'Immerse yourself in theatrical spectacle in the heart of Times Square.', img: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=600' },

        // Rome
        { city: 'Rome', name: 'Colosseum, Roman Forum & Palatine Hill Priority Access', category: 'sightseeing', cost: 75.00, duration: 3.5, desc: 'Walk through gladiatorial arenas and ancient emperor palaces with an archaeologist guide.', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=600' },
        { city: 'Rome', name: 'Vatican Museums, Sistine Chapel & St. Peter’s Basilica', category: 'sightseeing', cost: 60.00, duration: 3.5, desc: 'Marvel at Michelangelo’s famous ceiling and Rafael’s Renaissance frescoes.', img: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?q=80&w=600' },
        { city: 'Rome', name: 'Trastevere Sunset Pasta & Tiramisu Masterclass', category: 'food', cost: 85.00, duration: 3.0, desc: 'Make fresh fettuccine and authentic Roman carbonara paired with Chianti red wine.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=600' },

        // London
        { city: 'London', name: 'Tower of London & Crown Jewels Exhibition', category: 'sightseeing', cost: 38.00, duration: 2.5, desc: 'Discover nearly 1,000 years of royal intrigue, ravens, and dazzling crown diamonds.', img: 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?q=80&w=600' },
        { city: 'London', name: 'Borough Market British Food & Craft Cider Tour', category: 'food', cost: 50.00, duration: 2.5, desc: 'Sample Scotch eggs, artisanal Neal’s Yard cheeses, sausage rolls, and sweet fudge.', img: 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?q=80&w=600' },
        { city: 'London', name: 'British Museum Ancient Egypt & Rosetta Stone Walk', category: 'sightseeing', cost: 20.00, duration: 2.0, desc: 'Explore world history from the Parthenon sculptures to Egyptian mummies.', img: 'https://images.unsplash.com/photo-1568285563393-99ea48cb5695?q=80&w=600' },

        // Sydney
        { city: 'Sydney', name: 'Sydney Opera House Behind-the-Scenes Architectural Tour', category: 'sightseeing', cost: 42.00, duration: 1.5, desc: 'Go inside the world-famous sails and discover the engineering genius of Jørn Utzon.', img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=600' },
        { city: 'Sydney', name: 'Bondi to Coogee Coastal Clifftop Trek', category: 'adventure', cost: 0.00, duration: 3.0, desc: 'Breathtaking 6km coastal trail passing dramatic cliffs, rock pools, and Tamarama beach.', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600' },
        { city: 'Sydney', name: 'Sydney Harbour Sunset Catamaran Cruise', category: 'sightseeing', cost: 70.00, duration: 2.0, desc: 'Sip champagne with panoramic views of the Harbour Bridge and Opera House at dusk.', img: 'https://images.unsplash.com/photo-1524293581917-878a6d017c?q=80&w=600' },

        // Dubai
        { city: 'Dubai', name: 'Burj Khalifa Level 124 & 125 At The Top', category: 'sightseeing', cost: 52.00, duration: 2.0, desc: 'Stand on the observation deck of the world’s tallest skyscraper.', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=600' },
        { city: 'Dubai', name: 'Red Dune 4x4 Desert Safari with BBQ Dinner & Show', category: 'adventure', cost: 75.00, duration: 6.0, desc: 'Thrilling sandboarding, camel rides, belly dancing show, and buffet banquet.', img: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?q=80&w=600' },
        { city: 'Dubai', name: 'Old Dubai Souks & Abra Boat Crossing', category: 'shopping', cost: 20.00, duration: 2.5, desc: 'Explore glittering Gold Souk, fragrant Spice Souk, and cross the Creek on traditional boat.', img: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=600' },

        // Barcelona
        { city: 'Barcelona', name: 'Sagrada Família Towers & Fast-Track Guided Tour', category: 'sightseeing', cost: 55.00, duration: 2.0, desc: 'Witness Gaudí’s stained-glass forest and take elevators up to the Nativity towers.', img: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=600' },
        { city: 'Barcelona', name: 'Park Güell Mosaic Serpent & Monumental Zone', category: 'sightseeing', cost: 22.00, duration: 2.0, desc: 'Fairytale gardens and vibrantly tiled benches overlooking Barcelona and the sea.', img: 'https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?q=80&w=600' },
        { city: 'Barcelona', name: 'Gothic Quarter Evening Tapas & Cava Crawl', category: 'food', cost: 65.00, duration: 3.0, desc: 'Sample patatas bravas, Iberian jamón, crispy croquetas, and sparkling Catalan cava.', img: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=600' },

        // Bangkok
        { city: 'Bangkok', name: 'Grand Palace & Wat Phra Kaew (Emerald Buddha)', category: 'sightseeing', cost: 20.00, duration: 3.0, desc: 'The historic seat of the Siamese royal court, covered in golden mosaics.', img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=600' },
        { city: 'Bangkok', name: 'Damnoen Saduak Floating Market & Longtail Boat', category: 'shopping', cost: 35.00, duration: 4.5, desc: 'Glide past wooden canoes piled high with fresh mangoes, coconut pancakes, and noodles.', img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=600' },
        { city: 'Bangkok', name: 'Chinatown (Yaowarat) Midnight Tuk-Tuk Food Tour', category: 'food', cost: 45.00, duration: 3.5, desc: 'Zip through neon alleys to taste guay tiew noodles, toasted buns, and pad thai.', img: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=600' },

        // Cape Town
        { city: 'Cape Town', name: 'Table Mountain Cable Car & Summit Nature Trail', category: 'adventure', cost: 30.00, duration: 3.0, desc: 'Revolving cable car ride to flat-top mountain peaks with sweeping Atlantic views.', img: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=600' },
        { city: 'Cape Town', name: 'Cape Peninsula & Boulders Beach African Penguin Colony', category: 'adventure', cost: 65.00, duration: 7.0, desc: 'Drive Chapman’s Peak, stand at Cape of Good Hope, and watch penguins waddle on white sands.', img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=600' },
        { city: 'Cape Town', name: 'Stellenbosch Historic Wine Tasting & Cellar Tour', category: 'food', cost: 70.00, duration: 5.0, desc: 'Sample world-renowned Pinotage and Chenin Blanc across scenic Dutch-colonial estates.', img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=600' },

        // Rio de Janeiro
        { city: 'Rio de Janeiro', name: 'Christ the Redeemer by Cogwheel Train through Tijuca Forest', category: 'sightseeing', cost: 40.00, duration: 3.0, desc: 'Travel through Atlantic rainforest to the towering Art Deco statue atop Corcovado mountain.', img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=600' },
        { city: 'Rio de Janeiro', name: 'Sugarloaf Mountain Cable Car at Golden Hour', category: 'sightseeing', cost: 35.00, duration: 2.5, desc: 'Glass-walled cable car offering sunset views over Guanabara Bay and Copacabana beach.', img: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?q=80&w=600' },
        { city: 'Rio de Janeiro', name: 'Samba School Night Rehearsal Experience', category: 'other', cost: 45.00, duration: 3.5, desc: 'Feel the thunderous percussive heartbeat of Rio Carnival at a top-tier samba school.', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600' },
      ];

      for (const a of catalogData) {
        const cityId = cityIdMap[a.city];
        if (!cityId) continue;
        await connection.execute(`
          INSERT INTO activities_catalog (city_id, name, category, estimated_cost, duration_hours, description, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [cityId, a.name, a.category, a.cost, a.duration, a.desc, a.img]);
      }

      console.log('[Bootstrap DB] 12 cities and 36 activities successfully seeded.');
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('[Bootstrap DB] Database initialization complete.');
  } catch (err) {
    console.error('[Bootstrap DB Error]:', err);
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = bootstrapDatabase;
