const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  addChecklistItem,
  getChecklist,
  toggleItem,
  resetChecklist,
  deleteChecklistItem,
} = require('../controllers/checklistController');

const router = express.Router({ mergeParams: true });

// All checklist routes require a valid JWT
router.use(protect);

// POST   /api/trips/:tripId/checklist        — add item
// GET    /api/trips/:tripId/checklist        — list all items
router.route('/')
  .post(addChecklistItem)
  .get(getChecklist);

// PATCH  /api/trips/:tripId/checklist/reset  — reset all items to unpacked (Declared before :itemId)
router.patch('/reset', resetChecklist);

// PATCH  /api/trips/:tripId/checklist/:itemId — toggle single item
// DELETE /api/trips/:tripId/checklist/:itemId — remove item
router.route('/:itemId')
  .patch(toggleItem)
  .delete(deleteChecklistItem);

module.exports = router;
