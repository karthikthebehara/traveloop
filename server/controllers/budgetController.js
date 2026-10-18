const pool = require('../config/db');
const Joi  = require('joi');

// ── Helper: verify trip ownership ─────────────────────────────
const verifyTripOwner = async (tripId, userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM trips WHERE id = ? AND user_id = ? LIMIT 1',
    [tripId, userId]
  );
  return rows[0] ?? null;
};

// ── Joi Schema for logging expenses ───────────────────────────
const expenseSchema = Joi.object({
  trip_stop_id: Joi.number().integer().positive().optional().allow(null),
  category:     Joi.string().valid('Transport', 'Stay', 'Activities', 'Meals', 'Other').required(),
  amount:       Joi.number().positive().precision(2).required(),
  expense_date: Joi.date().iso().optional().allow(null),
  notes:        Joi.string().max(255).optional().allow('', null),
});

// ──────────────────────────────────────────────────────────────
// GET /api/trips/:tripId/budget
// 4 strict categories, daily spending, over-budget day alerts, avg/day
// ──────────────────────────────────────────────────────────────
const getBudgetSummary = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const trip = await verifyTripOwner(tripId, req.user.id);
  if (!trip) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  try {
    // 1. Fetch activities cost
    const [activities] = await pool.execute(
      `SELECT a.id, a.title, a.category, a.cost, a.scheduled_date, a.start_time
       FROM activities a
       INNER JOIN stops s ON s.id = a.stop_id
       WHERE s.trip_id = ?`,
      [tripId]
    );

    // 2. Fetch logged trip_expenses
    const [expenses] = await pool.execute(
      `SELECT te.*, s.city_name
       FROM trip_expenses te
       LEFT JOIN stops s ON s.id = te.trip_stop_id
       WHERE te.trip_id = ?
       ORDER BY te.expense_date ASC, te.id ASC`,
      [tripId]
    );

    // 3. Normalize into the 4 required categories: 'Transport', 'Stay', 'Activities', 'Meals'
    const categoryTotals = {
      Transport:  0,
      Stay:       0,
      Activities: 0,
      Meals:      0,
    };

    // Group activities into the 4 categories
    for (const a of activities) {
      const cost = parseFloat(a.cost || 0);
      if (a.category === 'transport') {
        categoryTotals.Transport += cost;
      } else if (a.category === 'accommodation') {
        categoryTotals.Stay += cost;
      } else if (a.category === 'food') {
        categoryTotals.Meals += cost;
      } else {
        // sightseeing, adventure, shopping, other -> Activities
        categoryTotals.Activities += cost;
      }
    }

    // Group trip_expenses into the 4 categories
    for (const e of expenses) {
      const amt = parseFloat(e.amount || 0);
      if (e.category === 'Transport')      categoryTotals.Transport  += amt;
      else if (e.category === 'Stay')      categoryTotals.Stay       += amt;
      else if (e.category === 'Meals')     categoryTotals.Meals      += amt;
      else if (e.category === 'Activities')categoryTotals.Activities += amt;
      else categoryTotals.Activities += amt; // other -> activities
    }

    const byCategory = Object.entries(categoryTotals).map(([cat, total]) => ({
      category: cat,
      total:    parseFloat(total.toFixed(2)),
    }));

    const totalSpent = parseFloat(
      (categoryTotals.Transport + categoryTotals.Stay + categoryTotals.Activities + categoryTotals.Meals).toFixed(2)
    );
    const totalBudget = parseFloat(trip.total_budget || 0);
    const dailyThreshold = parseFloat(trip.daily_budget_threshold || 0);
    const remaining = parseFloat((totalBudget - totalSpent).toFixed(2));
    const pctUsed = totalBudget > 0 ? parseFloat(((totalSpent / totalBudget) * 100).toFixed(1)) : 0;

    // 4. Calculate Trip Duration (days) and Average Cost Per Day
    let daysCount = 1;
    if (trip.start_date && trip.end_date) {
      const start = new Date(trip.start_date);
      const end   = new Date(trip.end_date);
      const diff  = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      daysCount   = diff > 0 ? diff : 1;
    }
    const avgCostPerDay = parseFloat((totalSpent / daysCount).toFixed(2));

    // 5. Day-wise spending breakdown and Over-Budget Days
    const dayMap = {};

    // Group activities by date
    for (const a of activities) {
      const d = a.scheduled_date
        ? a.scheduled_date.toISOString ? a.scheduled_date.toISOString().split('T')[0] : String(a.scheduled_date).slice(0, 10)
        : (a.start_time ? String(a.start_time).slice(0, 10) : 'Unscheduled');
      if (!dayMap[d]) dayMap[d] = { date: d, activities: 0, expenses: 0, total: 0, items: [] };
      const cost = parseFloat(a.cost || 0);
      dayMap[d].activities += cost;
      dayMap[d].total += cost;
      dayMap[d].items.push({ type: 'activity', name: a.title, amount: cost });
    }

    // Group expenses by date
    for (const e of expenses) {
      const d = e.expense_date
        ? (e.expense_date.toISOString ? e.expense_date.toISOString().split('T')[0] : String(e.expense_date).slice(0, 10))
        : 'Unscheduled';
      if (!dayMap[d]) dayMap[d] = { date: d, activities: 0, expenses: 0, total: 0, items: [] };
      const amt = parseFloat(e.amount || 0);
      dayMap[d].expenses += amt;
      dayMap[d].total += amt;
      dayMap[d].items.push({ type: 'expense', name: e.notes || e.category, amount: amt });
    }

    const byDay = Object.values(dayMap)
      .filter(x => x.date !== 'Unscheduled')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        total:      parseFloat(d.total.toFixed(2)),
        activities: parseFloat(d.activities.toFixed(2)),
        expenses:   parseFloat(d.expenses.toFixed(2)),
        is_over_budget: dailyThreshold > 0 && d.total > dailyThreshold,
      }));

    const overBudgetDays = byDay.filter(d => d.is_over_budget);

    res.json({
      status: 'success',
      data: {
        currency:               trip.currency || 'USD',
        total_budget:           totalBudget,
        daily_budget_threshold: dailyThreshold,
        total_spent:            totalSpent,
        remaining,
        pct_used:               pctUsed,
        over_budget:            remaining < 0,
        days_count:             daysCount,
        average_cost_per_day:   avgCostPerDay,
        by_category:            byCategory,
        by_day:                 byDay,
        over_budget_days:       overBudgetDays,
      },
    });
  } catch (err) {
    console.error('[getBudgetSummary]', err);
    res.status(500).json({ status: 'error', message: 'Failed to calculate budget.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/:tripId/expenses
// List all logged expenses
// ──────────────────────────────────────────────────────────────
const getExpenses = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const trip = await verifyTripOwner(tripId, req.user.id);
  if (!trip) {
    return res.status(403).json({ status: 'fail', message: 'Access denied.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT te.*, s.city_name
       FROM trip_expenses te
       LEFT JOIN stops s ON s.id = te.trip_stop_id
       WHERE te.trip_id = ?
       ORDER BY te.expense_date DESC, te.id DESC`,
      [tripId]
    );

    res.json({ status: 'success', results: rows.length, data: { expenses: rows } });
  } catch (err) {
    console.error('[getExpenses]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch expenses.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/trips/:tripId/expenses
// Log a new expense (Transport, Stay, Activities, Meals)
// ──────────────────────────────────────────────────────────────
const addExpense = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const trip = await verifyTripOwner(tripId, req.user.id);
  if (!trip) {
    return res.status(403).json({ status: 'fail', message: 'Access denied.' });
  }

  const { error, value } = expenseSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const { trip_stop_id, category, amount, expense_date, notes } = value;

  try {
    const [result] = await pool.execute(
      `INSERT INTO trip_expenses (trip_id, trip_stop_id, category, amount, expense_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tripId, trip_stop_id ?? null, category, amount, expense_date ?? null, notes ?? null]
    );

    const [rows] = await pool.execute(
      `SELECT te.*, s.city_name
       FROM trip_expenses te
       LEFT JOIN stops s ON s.id = te.trip_stop_id
       WHERE te.id = ? LIMIT 1`,
      [result.insertId]
    );

    res.status(201).json({ status: 'success', data: { expense: rows[0] } });
  } catch (err) {
    console.error('[addExpense]', err);
    res.status(500).json({ status: 'error', message: 'Failed to log expense.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/trips/:tripId/expenses/:expId
// Delete a logged expense
// ──────────────────────────────────────────────────────────────
const deleteExpense = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const expId  = parseInt(req.params.expId, 10);

  if (isNaN(tripId) || isNaN(expId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID.' });
  }

  const trip = await verifyTripOwner(tripId, req.user.id);
  if (!trip) {
    return res.status(403).json({ status: 'fail', message: 'Access denied.' });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM trip_expenses WHERE id = ? AND trip_id = ?',
      [expId, tripId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'Expense not found.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[deleteExpense]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete expense.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PATCH /api/trips/:tripId/share
// ──────────────────────────────────────────────────────────────
const toggleSharing = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const trip = await verifyTripOwner(tripId, req.user.id);
  if (!trip) {
    return res.status(403).json({ status: 'fail', message: 'Access denied.' });
  }

  try {
    const newStatus = trip.sharing_status === 'public' ? 'private' : 'public';
    await pool.execute('UPDATE trips SET sharing_status = ? WHERE id = ?', [newStatus, tripId]);

    res.json({
      status: 'success',
      data: {
        tripId,
        sharing_status: newStatus,
        public_url: newStatus === 'public' ? `/public/${tripId}` : null,
      },
    });
  } catch (err) {
    console.error('[toggleSharing]', err);
    res.status(500).json({ status: 'error', message: 'Failed to update sharing status.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/public/:tripId
// ──────────────────────────────────────────────────────────────
const getPublicTrip = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  try {
    const [tripRows] = await pool.execute(
      `SELECT t.*, u.name AS owner_name
       FROM trips t
       INNER JOIN users u ON u.id = t.user_id
       WHERE t.id = ? AND t.sharing_status = 'public'
       LIMIT 1`,
      [tripId]
    );

    if (!tripRows.length) {
      return res.status(404).json({
        status:  'fail',
        message: 'This trip is not publicly available.',
      });
    }

    const [stops] = await pool.execute(
      `SELECT s.*, c.image_url AS city_image
       FROM stops s
       LEFT JOIN cities c ON c.id = s.city_id
       WHERE s.trip_id = ?
       ORDER BY s.order_index ASC`,
      [tripId]
    );

    const [activities] = await pool.execute(
      `SELECT a.* FROM activities a
       INNER JOIN stops s ON s.id = a.stop_id
       WHERE s.trip_id = ?
       ORDER BY s.order_index ASC, a.scheduled_date ASC, a.start_time ASC`,
      [tripId]
    );

    const stopMap = stops.map((stop) => ({
      ...stop,
      activities: activities.filter((a) => a.stop_id === stop.id),
    }));

    res.json({
      status: 'success',
      data: {
        trip:  tripRows[0],
        stops: stopMap,
      },
    });
  } catch (err) {
    console.error('[getPublicTrip]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch public trip.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/trips/:tripId/share-email
// ──────────────────────────────────────────────────────────────
const shareTripEmail = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const { email } = req.body;
  if (isNaN(tripId) || !email) {
    return res.status(400).json({ status: 'fail', message: 'Valid trip ID and recipient email are required.' });
  }

  const trip = await verifyTripOwner(tripId, req.user.id);
  if (!trip) {
    return res.status(403).json({ status: 'fail', message: 'Trip not found or permission denied.' });
  }

  try {
    if (trip.sharing_status !== 'public') {
      await pool.execute('UPDATE trips SET sharing_status = "public" WHERE id = ?', [tripId]);
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const shareUrl = `${clientUrl}/public/${tripId}`;

    const { sendTripShareEmail } = require('../utils/mailer');
    await sendTripShareEmail({
      to: email,
      senderName: req.user.name || 'A Traveloop Traveler',
      tripTitle: trip.title,
      shareUrl,
    });

    res.json({
      status: 'success',
      message: `Itinerary share email sent to ${email}`,
      data: { shareUrl },
    });
  } catch (err) {
    console.error('[shareTripEmail]', err);
    res.status(500).json({ status: 'error', message: 'Failed to send share email.' });
  }
};

module.exports = {
  getBudgetSummary,
  getExpenses,
  addExpense,
  deleteExpense,
  toggleSharing,
  getPublicTrip,
  shareTripEmail,
};
