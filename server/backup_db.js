const fs   = require('fs');
const path = require('path');
const pool = require('./config/db');

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, '../database/backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const sqlFilePath  = path.join(backupDir, `traveloop_backup_${timestamp}.sql`);
  const jsonFilePath = path.join(backupDir, `traveloop_backup_${timestamp}.json`);

  console.log(`[Database Backup] Starting backup at ${new Date().toISOString()}...`);

  try {
    const [tablesResult] = await pool.query('SHOW TABLES');
    const tableKey = Object.keys(tablesResult[0])[0];
    const tableNames = tablesResult.map(row => row[tableKey]);

    const backupData = {
      timestamp: new Date().toISOString(),
      database: process.env.DB_NAME || 'odoo_hackathon',
      tables: {},
      summary: {},
    };

    let sqlContent = `-- ========================================================\n`;
    sqlContent += `-- Traveloop MySQL Database Snapshot\n`;
    sqlContent += `-- Timestamp: ${new Date().toISOString()}\n`;
    sqlContent += `-- Database: ${process.env.DB_NAME || 'odoo_hackathon'}\n`;
    sqlContent += `-- ========================================================\n\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const tableName of tableNames) {
      // 1. Get Table Creation Schema
      const [createTableResult] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createTableSql = createTableResult[0]['Create Table'];

      sqlContent += `-- Table structure for table \`${tableName}\`\n`;
      sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlContent += `${createTableSql};\n\n`;

      // 2. Get All Table Rows
      const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
      backupData.tables[tableName] = rows;
      backupData.summary[tableName] = rows.length;

      if (rows.length > 0) {
        sqlContent += `-- Dumping data for table \`${tableName}\` (${rows.length} rows)\n`;
        const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');

        for (const row of rows) {
          const values = Object.values(row).map(val => {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            if (typeof val === 'boolean') return val ? 1 : 0;
            // Escape string
            return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          }).join(', ');

          sqlContent += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
        }
        sqlContent += `\n`;
      }
    }

    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sqlContent += `-- Backup Completed Successfully.\n`;

    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    fs.writeFileSync(jsonFilePath, JSON.stringify(backupData, null, 2), 'utf8');

    console.log(`[Database Backup] Success!`);
    console.log(`  SQL Dump:  ${sqlFilePath}`);
    console.log(`  JSON Dump: ${jsonFilePath}`);
    console.log(`  Tables Backed Up:`);
    Object.entries(backupData.summary).forEach(([t, count]) => {
      console.log(`    - ${t}: ${count} rows`);
    });

    process.exit(0);
  } catch (err) {
    console.error(`[Database Backup Error]`, err);
    process.exit(1);
  }
}

runBackup();
