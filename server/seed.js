require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Starting Traveloop Database Seeding...');

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     process.env.DB_PORT || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'odoo_hackathon',
  });

  try {
    // 1. Seed / ensure admin and demo users
    console.log('1. Seeding Users (Admin & Demo)...');
    const adminPassHash = await bcrypt.hash('Admin@123', 10);
    const demoPassHash  = await bcrypt.hash('Demo@123', 10);

    await conn.execute(`
      INSERT INTO users (name, email, role, password_hash, avatar_url, language_preference)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        role = VALUES(role),
        name = VALUES(name),
        password_hash = VALUES(password_hash),
        language_preference = VALUES(language_preference)
    `, ['Admin User', 'admin@traveloop.com', 'admin', adminPassHash, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250', 'en']);

    await conn.execute(`
      INSERT INTO users (name, email, role, password_hash, avatar_url, language_preference)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        password_hash = VALUES(password_hash)
    `, ['Demo Traveler', 'demo@traveloop.com', 'user', demoPassHash, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250', 'en']);

    // Ensure all existing users are admins for immediate testing
    await conn.execute(`UPDATE users SET role = 'admin' WHERE email = 'admin@traveloop.com' OR role IS NULL OR role = 'user' AND email != 'demo@traveloop.com'`);
    console.log('  ✓ Admin and demo accounts seeded');

    // Fetch admin user ID
    const [adminRows] = await conn.execute(`SELECT id FROM users WHERE email = 'admin@traveloop.com' LIMIT 1`);
    const adminId = adminRows[0].id;

    // 2. Seed 12 Global Cities
    console.log('2. Seeding 12 Global Cities...');
    const citiesData = [
      {
        name: 'Paris', country: 'France', country_code: 'FR', region: 'Europe',
        cost_index: 4, popularity_score: 98,
        image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800',
        description: 'The City of Light dazzles with iconic architecture, haute cuisine, world-class art at the Louvre, and romantic Seine river cruises.',
      },
      {
        name: 'Tokyo', country: 'Japan', country_code: 'JP', region: 'Asia',
        cost_index: 4, popularity_score: 97,
        image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800',
        description: 'An exhilarating blend of neon-lit skyscrapers and historic temples, celebrated for unmatched gastronomy, anime culture, and peaceful gardens.',
      },
      {
        name: 'Bali', country: 'Indonesia', country_code: 'ID', region: 'Asia',
        cost_index: 2, popularity_score: 95,
        image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800',
        description: 'Island of the Gods featuring lush terraced rice paddies, volcanic peaks, sacred water temples, and world-class surfing beaches.',
      },
      {
        name: 'New York', country: 'United States', country_code: 'US', region: 'North America',
        cost_index: 5, popularity_score: 96,
        image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800',
        description: 'The city that never sleeps, famous for Central Park, Broadway shows, world-renowned skyline, and vibrant multicultural neighborhoods.',
      },
      {
        name: 'Rome', country: 'Italy', country_code: 'IT', region: 'Europe',
        cost_index: 3, popularity_score: 94,
        image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800',
        description: 'The Eternal City where ancient history comes alive through the Colosseum, Vatican City, and winding cobblestone streets filled with pasta trattorias.',
      },
      {
        name: 'London', country: 'United Kingdom', country_code: 'GB', region: 'Europe',
        cost_index: 5, popularity_score: 95,
        image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800',
        description: 'A global metropolis bridging royal tradition and modern creativity, from the Tower of London and West End theatres to lively riverside markets.',
      },
      {
        name: 'Sydney', country: 'Australia', country_code: 'AU', region: 'Oceania',
        cost_index: 4, popularity_score: 91,
        image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=800',
        description: 'Sun-drenched harbor city known for the architectural masterpiece Sydney Opera House, Bondi coastal walks, and vibrant harbor ferries.',
      },
      {
        name: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', region: 'Middle East',
        cost_index: 5, popularity_score: 93,
        image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800',
        description: 'Futuristic oasis of luxury, featuring the record-breaking Burj Khalifa, desert dune safaris, indoor ski slopes, and sprawling souks.',
      },
      {
        name: 'Barcelona', country: 'Spain', country_code: 'ES', region: 'Europe',
        cost_index: 3, popularity_score: 92,
        image_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=800',
        description: 'Mediterranean gem brimming with Antoni Gaudí’s surreal masterpieces like Sagrada Família, sandy city beaches, and late-night tapas bars.',
      },
      {
        name: 'Bangkok', country: 'Thailand', country_code: 'TH', region: 'Asia',
        cost_index: 2, popularity_score: 90,
        image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=800',
        description: 'Vibrant street life, ornate floating shrines, bustling night markets, and Michelin-starred street food stalls that never sleep.',
      },
      {
        name: 'Cape Town', country: 'South Africa', country_code: 'ZA', region: 'Africa',
        cost_index: 2, popularity_score: 88,
        image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=800',
        description: 'Dramatic coastal scenery flanked by Table Mountain, penguin beaches at Boulders, world-class Cape winelands, and scenic ocean drives.',
      },
      {
        name: 'Rio de Janeiro', country: 'Brazil', country_code: 'BR', region: 'South America',
        cost_index: 2, popularity_score: 89,
        image_url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800',
        description: 'Samba rhythms, golden stretches of Copacabana and Ipanema beaches, and the awe-inspiring Christ the Redeemer overlooking Sugarloaf Mountain.',
      },
    ];

    const cityIdMap = {};
    for (const c of citiesData) {
      await conn.execute(`
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

      const [r] = await conn.execute(`SELECT id FROM cities WHERE name = ? AND country = ? LIMIT 1`, [c.name, c.country]);
      cityIdMap[c.name] = r[0].id;
    }
    console.log(`  ✓ 12 Cities seeded successfully`);

    // 3. Seed 36+ Activities Catalog (3+ per city)
    console.log('3. Seeding 36+ Activities in activities_catalog...');
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
      { city: 'Sydney', name: 'Sydney Harbour Sunset Catamaran Cruise', category: 'sightseeing', cost: 70.00, duration: 2.0, desc: 'Sip champagne with panoramic views of the Harbour Bridge and Opera House at dusk.', img: 'https://images.unsplash.com/photo-1524293581917-878a6d017c structure?q=80&w=600' },

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
      await conn.execute(`
        INSERT INTO activities_catalog (city_id, name, category, estimated_cost, duration_hours, description, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [cityId, a.name, a.category, a.cost, a.duration, a.desc, a.img]);
    }
    console.log(`  ✓ ${catalogData.length} Activities seeded across 12 cities`);

    // 4. Seed Saved Destinations for Admin & Demo
    console.log('4. Seeding Saved Destinations...');
    const parisId = cityIdMap['Paris'];
    const tokyoId = cityIdMap['Tokyo'];
    const baliId  = cityIdMap['Bali'];
    const romeId  = cityIdMap['Rome'];

    await conn.execute(`INSERT IGNORE INTO saved_destinations (user_id, city_id) VALUES (?, ?), (?, ?), (?, ?)`,
      [adminId, parisId, adminId, tokyoId, adminId, baliId]);
    console.log('  ✓ Saved destinations bookmarked');

    // 5. Seed Complete Sample Multi-City Trip (Paris & Rome) with Expenses & Over-Budget Day
    console.log('5. Seeding Complete Sample Multi-City Trip with Over-Budget Alert...');
    
    // Check if sample trip already exists
    const [existingTrip] = await conn.execute(`SELECT id FROM trips WHERE share_slug = 'grand-euro-adventure-2026' LIMIT 1`);
    let sampleTripId;

    if (existingTrip.length > 0) {
      sampleTripId = existingTrip[0].id;
      // Delete old trip records to recreate fresh sample
      await conn.execute(`DELETE FROM trips WHERE id = ?`, [sampleTripId]);
    }

    const [tripRes] = await conn.execute(`
      INSERT INTO trips (
        user_id, title, description, start_date, end_date, total_budget, daily_budget_threshold,
        currency, sharing_status, share_slug, cover_image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      adminId,
      'Grand European Adventure: Paris & Rome',
      'An unforgettable 10-day cultural journey across France and Italy, exploring royal palaces, world-renowned museums, and culinary treasures.',
      '2026-06-01',
      '2026-06-10',
      3500.00,
      350.00, // Daily budget threshold: $350/day
      'USD',
      'public',
      'grand-euro-adventure-2026',
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200',
    ]);
    sampleTripId = tripRes.insertId;

    // Create 2 Stops: Paris and Rome
    const [stop1] = await conn.execute(`
      INSERT INTO stops (trip_id, city_id, city_name, country_code, arrival_date, departure_date, order_index, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [sampleTripId, parisId, 'Paris', 'FR', '2026-06-01', '2026-06-05', 0, 'Stay near Saint-Germain or Le Marais']);

    const [stop2] = await conn.execute(`
      INSERT INTO stops (trip_id, city_id, city_name, country_code, arrival_date, departure_date, order_index, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [sampleTripId, romeId, 'Rome', 'IT', '2026-06-05', '2026-06-10', 1, 'Central hub near Piazza Navona']);

    const stop1Id = stop1.insertId;
    const stop2Id = stop2.insertId;

    // Scheduled Activities in Paris & Rome
    console.log('  + Adding scheduled activities to stops...');
    await conn.execute(`
      INSERT INTO activities (stop_id, title, category, cost, scheduled_date, duration_hours, location_name, is_booked)
      VALUES 
        (?, 'Louvre Museum Masterpieces Guided Tour', 'sightseeing', 45.00, '2026-06-02', 3.0, 'Musée du Louvre', 1),
        (?, 'Eiffel Tower Summit & Champagne', 'sightseeing', 85.00, '2026-06-03', 2.5, 'Champ de Mars', 1),
        (?, 'Montmartre Secret Bakeries & Wine Walking Tour', 'food', 65.00, '2026-06-04', 3.0, 'Place du Tertre', 0)
    `, [stop1Id, stop1Id, stop1Id]);

    await conn.execute(`
      INSERT INTO activities (stop_id, title, category, cost, scheduled_date, duration_hours, location_name, is_booked)
      VALUES 
        (?, 'Colosseum, Roman Forum & Palatine Hill Priority Access', 'sightseeing', 75.00, '2026-06-06', 3.5, 'Piazza del Colosseo', 1),
        (?, 'Vatican Museums, Sistine Chapel & St. Peter’s', 'sightseeing', 60.00, '2026-06-07', 3.5, 'Vatican City', 1),
        (?, 'Trastevere Sunset Pasta & Tiramisu Masterclass', 'food', 85.00, '2026-06-08', 3.0, 'Trastevere', 1)
    `, [stop2Id, stop2Id, stop2Id]);

    // Trip Expenses with OVER-BUDGET DAY on 2026-06-03
    // On 2026-06-03: Eiffel Tower activity ($85) + Michelin 3-Star Gala Dinner ($380) = $465 > $350 daily threshold!
    console.log('  + Adding categorized trip expenses (Transport, Stay, Activities, Meals)...');
    await conn.execute(`
      INSERT INTO trip_expenses (trip_id, trip_stop_id, category, amount, expense_date, notes)
      VALUES 
        (?, ?, 'Stay', 720.00, '2026-06-01', 'Boutique Hotel Saint-Germain (4 nights)'),
        (?, ?, 'Meals', 65.00, '2026-06-02', 'Bistro Paul Bert lunch with wine'),
        (?, ?, 'Meals', 380.00, '2026-06-03', 'Michelin Gala Dinner at Le Gabriel (OVER BUDGET DAY)'),
        (?, ?, 'Transport', 160.00, '2026-06-05', 'Air France flight Paris CDG to Rome FCO'),
        (?, ?, 'Stay', 850.00, '2026-06-05', 'Piazza Navona Suites (5 nights)'),
        (?, ?, 'Meals', 85.00, '2026-06-06', 'Osteria Da Fortunata handmade pasta & Chianti'),
        (?, ?, 'Transport', 45.00, '2026-06-07', 'Rome Metro 7-day transit passes')
    `, [
      sampleTripId, stop1Id,
      sampleTripId, stop1Id,
      sampleTripId, stop1Id,
      sampleTripId, null,
      sampleTripId, stop2Id,
      sampleTripId, stop2Id,
      sampleTripId, stop2Id,
    ]);

    // Packing Checklist
    console.log('  + Adding packing items...');
    await conn.execute(`
      INSERT INTO packing_checklist (trip_id, item_name, category, quantity, is_packed)
      VALUES 
        (?, 'Passport, Schengen Visa & Health Card', 'Documents', 1, 1),
        (?, 'European Type-C / Type-E Plug Adapters', 'Electronics', 2, 1),
        (?, 'Noise-Cancelling Headphones', 'Electronics', 1, 1),
        (?, 'Comfortable Italian Cobblestone Walking Shoes', 'Clothing', 1, 1),
        (?, 'Smart Evening Outfits for Dinners', 'Clothing', 3, 0),
        (?, 'Travel Umbrella & Compact Rain Jacket', 'Clothing', 1, 0),
        (?, 'TSA 100ml Toiletry Kit & SPF Sunscreen', 'Toiletries', 1, 1),
        (?, 'Portable Power Bank (10,000 mAh)', 'Electronics', 1, 1),
        (?, 'Mini Travel Pharmacy & Ibuprofen', 'General', 1, 0)
    `, [sampleTripId, sampleTripId, sampleTripId, sampleTripId, sampleTripId, sampleTripId, sampleTripId, sampleTripId, sampleTripId]);

    // Trip Notes / Journal linked to stops and dates
    console.log('  + Adding trip journal notes...');
    await conn.execute(`
      INSERT INTO trip_notes (trip_id, trip_stop_id, note_date, title, content)
      VALUES 
        (?, ?, '2026-06-01', 'Paris Arrival & Hotel Check-in Details', 'Door code is #4829A, then press Bell 4. Host Marie will leave the keys in the lockbox. Pick up Navigo Easy metro cards at Gare du Nord station.'),
        (?, ?, '2026-06-03', 'Eiffel Tower Sunset Tips', 'Arrive at Security Gate 1 at least 45 minutes before reservation time. Bring photo ID matching booking voucher #FR-PAR-9921.'),
        (?, ?, '2026-06-05', 'FCO Airport to Rome Center', 'Take the non-stop Leonardo Express train directly from Fiumicino Airport to Roma Termini (runs every 15 min, 14 EUR). Avoid unofficial street taxis.')
    `, [sampleTripId, stop1Id, sampleTripId, stop1Id, sampleTripId, stop2Id]);

    console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
    throw err;
  } finally {
    await conn.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
