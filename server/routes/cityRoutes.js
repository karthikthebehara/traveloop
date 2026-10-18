const express = require('express');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const { getCities, getCityById, createCity } = require('../controllers/cityController');

const router = express.Router();

// Optional auth helper to check if a user is logged in
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      req.user = decoded;
    } catch (e) {}
  }
  next();
};

router.get('/', optionalAuth, getCities);
router.get('/:id', optionalAuth, getCityById);
router.post('/', protect, createCity);

module.exports = router;

