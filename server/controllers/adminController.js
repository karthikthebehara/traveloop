const pool = require('../config/db');

// ──────────────────────────────────────────────────────────────
// GET /api/admin/stats
// Platform-wide analytics — admin only
// ──────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [[{ total_users }]]      = await pool.execute('SELECT COUNT(*) AS total_users FROM users');
    const [[{ total_trips }]]      = await pool.execute('SELECT COUNT(*) AS total_trips FROM trips');
    const [[{ total_activities }]] = await pool.execute('SELECT COUNT(*) AS total_activities FROM activities');
    const [[{ total_stops }]]      = await pool.execute('SELECT COUNT(*) AS total_stops FROM stops');
    const [[{ total_expenses }]]   = await pool.execute('SELECT COUNT(*) AS total_expenses FROM trip_expenses');

    // Active planners: users with at least 1 trip
    const [[{ active_planners }]] = await pool.execute(
      'SELECT COUNT(DISTINCT user_id) AS active_planners FROM trips'
    );

    // Average trip budget
    const [[{ avg_budget }]] = await pool.execute(
      'SELECT ROUND(COALESCE(AVG(total_budget), 0), 2) AS avg_budget FROM trips WHERE total_budget > 0'
    );

    // Top 10 most visited cities
    const [top_cities] = await pool.execute(
      `SELECT city_name, COUNT(*) AS visit_count
       FROM stops
       GROUP BY city_name
       ORDER BY visit_count DESC
       LIMIT 10`
    );

    // Top categories
    const [top_categories] = await pool.execute(
      `SELECT category, COUNT(*) AS count, ROUND(SUM(cost),2) AS total_cost
       FROM activities
       GROUP BY category
       ORDER BY count DESC`
    );

    // Trips created per day (last 30 days)
    const [trips_over_time] = await pool.execute(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM trips
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // All registered users with trip counts
    const [recent_users] = await pool.execute(
      `SELECT id, name, email, role, avatar_url, language_preference, created_at,
              (SELECT COUNT(*) FROM trips WHERE trips.user_id = users.id) AS trip_count
       FROM users
       ORDER BY created_at DESC
       LIMIT 50`
    );

    // Public vs private trips
    const [sharing_breakdown] = await pool.execute(
      `SELECT sharing_status, COUNT(*) AS count
       FROM trips
       GROUP BY sharing_status`
    );

    res.json({
      status: 'success',
      data: {
        totals: {
          users:           total_users,
          trips:           total_trips,
          activities:      total_activities,
          stops:           total_stops,
          expenses:        total_expenses,
          active_planners: active_planners,
          avg_budget:      parseFloat(avg_budget || 0),
        },
        top_cities,
        top_categories,
        trips_over_time,
        recent_users,
        sharing_breakdown,
      },
    });
  } catch (err) {
    console.error('[getStats]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch admin stats.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/role
// Change a user's role between 'user' and 'admin'
// ──────────────────────────────────────────────────────────────
const updateUserRole = async (req, res) => {
  const targetUserId = parseInt(req.params.id, 10);
  const { role } = req.body;

  if (isNaN(targetUserId) || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ status: 'fail', message: 'Valid user ID and role ("user" or "admin") required.' });
  }

  // Prevent admin from removing their own admin status to avoid lockout
  if (targetUserId === req.user.id && role !== 'admin') {
    return res.status(400).json({ status: 'fail', message: 'Cannot demote your own admin account.' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, targetUserId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1',
      [targetUserId]
    );

    res.json({
      status:  'success',
      message: `User role updated to ${role}.`,
      data:    { user: rows[0] },
    });
  } catch (err) {
    console.error('[updateUserRole]', err);
    res.status(500).json({ status: 'error', message: 'Failed to update user role.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// Suspend / Delete a user account (cascades trips & data)
// ──────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  const targetUserId = parseInt(req.params.id, 10);
  if (isNaN(targetUserId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid user ID.' });
  }

  // Prevent self-deletion via admin endpoint
  if (targetUserId === req.user.id) {
    return res.status(400).json({ status: 'fail', message: 'Cannot delete your own admin account from here.' });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [targetUserId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    res.json({ status: 'success', message: 'User deleted successfully.' });
  } catch (err) {
    console.error('[deleteUser]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete user.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/admin/cities
// Add a new city to the global catalog
// ──────────────────────────────────────────────────────────────
const createCity = async (req, res) => {
  const { name, country, country_code, region, cost_index, popularity_score, image_url, description } = req.body;
  if (!name || !country) {
    return res.status(400).json({ status: 'fail', message: 'City name and country are required.' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO cities (name, country, country_code, region, cost_index, popularity_score, image_url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        country.trim(),
        country_code ? country_code.trim().toUpperCase() : null,
        region || 'Global',
        cost_index || 3,
        popularity_score || 80,
        image_url || null,
        description || null,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM cities WHERE id = ? LIMIT 1', [result.insertId]);
    res.status(201).json({ status: 'success', data: { city: rows[0] } });
  } catch (err) {
    console.error('[createCity]', err);
    res.status(500).json({ status: 'error', message: 'Failed to create city.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/admin/activities
// Add a new activity to the global catalog
// ──────────────────────────────────────────────────────────────
const createCatalogActivity = async (req, res) => {
  const { city_id, name, category, estimated_cost, duration_hours, description, image_url } = req.body;
  if (!city_id || !name) {
    return res.status(400).json({ status: 'fail', message: 'city_id and activity name are required.' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO activities_catalog (city_id, name, category, estimated_cost, duration_hours, description, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(city_id, 10),
        name.trim(),
        category || 'sightseeing',
        estimated_cost || 0.00,
        duration_hours || 2.0,
        description || null,
        image_url || null,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM activities_catalog WHERE id = ? LIMIT 1', [result.insertId]);
    res.status(201).json({ status: 'success', data: { activity: rows[0] } });
  } catch (err) {
    console.error('[createCatalogActivity]', err);
    res.status(500).json({ status: 'error', message: 'Failed to create catalog activity.' });
  }
};

module.exports = {
  getStats,
  updateUserRole,
  deleteUser,
  createCity,
  createCatalogActivity,
};
