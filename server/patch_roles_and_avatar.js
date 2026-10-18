const pool = require('./config/db');

async function run() {
  try {
    console.log('[Patch] Modifying avatar_url to LONGTEXT...');
    await pool.query('ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL');
    console.log('[Patch] avatar_url updated to LONGTEXT.');

    console.log('[Patch] Setting role = admin ONLY for admin@traveloop.com...');
    const [adminUpdate] = await pool.query(
      "UPDATE users SET role = 'admin' WHERE email = 'admin@traveloop.com'"
    );
    console.log(`[Patch] Admin update affected: ${adminUpdate.affectedRows} rows.`);

    console.log('[Patch] Resetting all other users to role = user...');
    const [userUpdate] = await pool.query(
      "UPDATE users SET role = 'user' WHERE email != 'admin@traveloop.com'"
    );
    console.log(`[Patch] User reset affected: ${userUpdate.affectedRows} rows.`);

    const [users] = await pool.query('SELECT id, name, email, role FROM users');
    console.log('[Patch] Current users in database:');
    console.table(users);

    process.exit(0);
  } catch (err) {
    console.error('[Patch] Error:', err);
    process.exit(1);
  }
}

run();
