const mysql = require('mysql2/promise');
require('dotenv').config();

const poolConfig = {
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'odoo_hackathon',
  waitForConnections: true,
  connectionLimit:    10,      // max concurrent connections
  queueLimit:         0,       // unlimited queue
  timezone:           'Z',     // store/retrieve times as UTC
};

// Enable SSL for cloud MySQL providers (PlanetScale, Aiven, Railway, Render, TiDB)
if (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

/**
 * mysql2/promise connection pool.
 * All DB modules import this pool and call pool.query() / pool.execute().
 */
const pool = mysql.createPool(poolConfig);

module.exports = pool;
