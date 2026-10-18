require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const TABLES_TO_TRUNCATE = [
  'trip_expenses',
  'trip_notes',
  'packing_checklist',
  'activities',
  'stops',
  'trip_collaborators',
  'trips',
  'saved_destinations',
  'activities_catalog',
  'cities',
];

async function cleanForLaunch() {
  console.log('======================================================');
  console.log('🚀 TRAVELOOP PRODUCTION DATABASE PURGE');
  console.log('======================================================');
  console.log(`Database: ${process.env.DB_NAME || 'odoo_hackathon'}`);

  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     process.env.DB_PORT || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'odoo_hackathon',
  });

  try {
    // 1. Temporarily disable foreign key constraints
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    console.log('\n[1/4] Foreign key checks disabled.');

    // 2. Truncate all transactional and catalog tables
    console.log('\n[2/4] Truncating transactional & catalog tables...');
    for (const table of TABLES_TO_TRUNCATE) {
      await connection.query(`TRUNCATE TABLE \`${table}\`;`);
      console.log(`  ✓ Truncated table: ${table} (auto-increment reset to 1)`);
    }

    // 3. Purge users keeping only the single master administrator
    console.log('\n[3/4] Purging demo/test users...');
    const [delRes] = await connection.query("DELETE FROM users WHERE email != 'admin@traveloop.com'");
    console.log(`  ✓ Removed ${delRes.affectedRows} non-admin user(s)`);

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    // Check if master admin exists
    const [adminRows] = await connection.query(
      "SELECT id, email, role FROM users WHERE email = 'admin@traveloop.com' LIMIT 1"
    );

    if (adminRows.length > 0) {
      await connection.query(
        "UPDATE users SET role = 'admin', password_hash = ?, name = 'Traveloop Administrator', first_name = 'Admin', last_name = 'Traveloop' WHERE email = 'admin@traveloop.com'",
        [hashedPassword]
      );
      console.log('  ✓ Master administrator account updated: admin@traveloop.com (role: admin, password: Admin@123)');
    } else {
      await connection.query(
        `INSERT INTO users (name, first_name, last_name, email, role, password_hash, language_preference)
         VALUES ('Traveloop Administrator', 'Admin', 'Traveloop', 'admin@traveloop.com', 'admin', ?, 'en')`,
        [hashedPassword]
      );
      console.log('  ✓ Created master administrator account: admin@traveloop.com (role: admin, password: Admin@123)');
    }

    // 4. Re-enable foreign key constraints
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('\n[4/4] Foreign key checks re-enabled.');

    // 5. Verification: Check row count across all tables
    console.log('\n======================================================');
    console.log('📊 PRODUCTION ROW COUNT AUDIT');
    console.log('======================================================');

    const allTables = [...TABLES_TO_TRUNCATE, 'users'];
    let allValid = true;

    for (const table of allTables) {
      const [cntRows] = await connection.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      const count = cntRows[0].total;
      const expected = table === 'users' ? 1 : 0;
      const status = count === expected ? 'PASS' : 'FAIL';
      if (count !== expected) allValid = false;

      console.log(`  - ${table.padEnd(22)} : ${count} row(s) [Expected: ${expected}] -> ${status}`);
    }

    console.log('======================================================');
    if (allValid) {
      console.log('🎉 SUCCESS: Database is 100% clean and ready for production!');
      console.log('Master Admin: admin@traveloop.com / Admin@123');
    } else {
      console.warn('⚠️ WARNING: Some table counts did not match expected production state.');
    }
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Database purge failed:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

cleanForLaunch()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
