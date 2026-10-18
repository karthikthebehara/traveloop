const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getStats,
  updateUserRole,
  deleteUser,
  createCity,
  createCatalogActivity,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require valid JWT + admin role
router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', getStats);

// User management
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id',      deleteUser);

// Catalog management
router.post('/cities',     createCity);
router.post('/activities', createCatalogActivity);

module.exports = router;
