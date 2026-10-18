const pool = require('../config/db');

// ──────────────────────────────────────────────────────────────
// GET /api/activities-catalog
// Search & filter activities across all cities or a specific city
// ──────────────────────────────────────────────────────────────
const getCatalogActivities = async (req, res) => {
  const { q, city_id, category, max_cost, max_duration, sort } = req.query;

  try {
    let query = `
      SELECT ac.*, c.name AS city_name, c.country AS country_name, c.country_code
      FROM activities_catalog ac
      INNER JOIN cities c ON c.id = ac.city_id
      WHERE 1=1
    `;
    const params = [];

    if (q && q.trim()) {
      query += ` AND (ac.name LIKE ? OR ac.description LIKE ?)`;
      const term = `%${q.trim()}%`;
      params.push(term, term);
    }

    if (city_id && !isNaN(city_id)) {
      query += ` AND ac.city_id = ?`;
      params.push(parseInt(city_id, 10));
    }

    if (category && category.trim() && category !== 'all') {
      query += ` AND ac.category = ?`;
      params.push(category.trim().toLowerCase());
    }

    if (max_cost && !isNaN(max_cost)) {
      query += ` AND ac.estimated_cost <= ?`;
      params.push(parseFloat(max_cost));
    }

    if (max_duration && !isNaN(max_duration)) {
      query += ` AND ac.duration_hours <= ?`;
      params.push(parseFloat(max_duration));
    }

    // Sort order
    if (sort === 'cost_asc') {
      query += ` ORDER BY ac.estimated_cost ASC`;
    } else if (sort === 'cost_desc') {
      query += ` ORDER BY ac.estimated_cost DESC`;
    } else if (sort === 'duration_asc') {
      query += ` ORDER BY ac.duration_hours ASC`;
    } else {
      query += ` ORDER BY ac.name ASC`;
    }

    const [rows] = await pool.execute(query, params);

    res.json({
      status:  'success',
      results: rows.length,
      data:    { activities: rows },
    });
  } catch (err) {
    console.error('[getCatalogActivities]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch catalog activities.' });
  }
};

module.exports = { getCatalogActivities };
