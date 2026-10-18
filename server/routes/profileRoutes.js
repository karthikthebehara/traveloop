const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getSavedDestinations,
  saveDestination,
  removeSavedDestination,
} = require('../controllers/profileController');

const router = express.Router();

// All profile endpoints require authentication
router.use(protect);

router.route('/')
  .get(getProfile)
  .put(updateProfile)
  .delete(deleteAccount);

router.put('/password', changePassword);

// Saved destinations
router.route('/saved-destinations')
  .get(getSavedDestinations)
  .post(saveDestination);

router.delete('/saved-destinations/:cityId', removeSavedDestination);

module.exports = router;
