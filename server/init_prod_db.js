require('dotenv').config();
const bootstrapDatabase = require('./utils/bootstrapDb');

if (require.main === module) {
  bootstrapDatabase()
    .then(() => {
      console.log('[Cloud DB Init] All tables, columns, admin user, and cities catalog verified.');
      console.log('[Cloud DB Init] Ready for server boot.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Cloud DB Init] Fatal startup initialization error:', err);
      process.exit(1);
    });
}

module.exports = bootstrapDatabase;
