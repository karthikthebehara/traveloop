const mysql = require('mysql2/promise');
require('dotenv').config();

const poolConfig = {
  waitForConnections: true,
  connectionLimit:    10,      // max concurrent connections
  queueLimit:         0,       // unlimited queue
  timezone:           'Z',     // store/retrieve times as UTC
  multipleStatements: true,
};

// Check if a cloud connection URI is provided (Render / Railway / Supabase / Aiven)
const dbUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (dbUri) {
  try {
    const parsed = new URL(dbUri);
    poolConfig.host     = parsed.hostname;
    poolConfig.port     = Number(parsed.port) || 3306;
    poolConfig.user     = decodeURIComponent(parsed.username);
    poolConfig.password = decodeURIComponent(parsed.password);
    poolConfig.database = parsed.pathname.replace(/^\//, '');
  } catch (err) {
    console.warn('[DB Config] Failed to parse DATABASE_URL via URL parser, falling back to uri');
    poolConfig.uri = dbUri;
  }
} else {
  poolConfig.host     = process.env.DB_HOST     || 'localhost';
  poolConfig.port     = Number(process.env.DB_PORT) || 3306;
  poolConfig.user     = process.env.DB_USER     || 'root';
  poolConfig.password = process.env.DB_PASSWORD || '';
  poolConfig.database = process.env.DB_NAME     || 'odoo_hackathon';
}

// Enable SSL for cloud MySQL providers (PlanetScale, Aiven, Railway, Render, TiDB)
if (
  process.env.DB_SSL === 'true' ||
  process.env.MYSQL_SSL === 'true' ||
  (dbUri && (dbUri.includes('ssl') || !dbUri.includes('localhost'))) ||
  (process.env.NODE_ENV === 'production' &&
   process.env.DB_SSL !== 'false' &&
   poolConfig.host !== 'localhost' &&
   poolConfig.host !== '127.0.0.1')
) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

/**
 * mysql2/promise connection pool.
 * All DB modules import this pool and call pool.query() / pool.execute().
 */
const pool = mysql.createPool(poolConfig);

module.exports = pool;
