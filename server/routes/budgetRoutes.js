const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getBudgetSummary,
  getExpenses,
  addExpense,
  deleteExpense,
  toggleSharing,
  getPublicTrip,
  shareTripEmail,
} = require('../controllers/budgetController');

const router = express.Router();

// Public route — no protect middleware
router.get('/public/:tripId', getPublicTrip);

// Protected routes below
router.get('/:tripId/budget', protect, getBudgetSummary);
router.patch('/:tripId/share', protect, toggleSharing);
router.post('/:tripId/share-email', protect, shareTripEmail);

// Expenses CRUD
router.get('/:tripId/expenses', protect, getExpenses);
router.post('/:tripId/expenses', protect, addExpense);
router.delete('/:tripId/expenses/:expId', protect, deleteExpense);

module.exports = router;
