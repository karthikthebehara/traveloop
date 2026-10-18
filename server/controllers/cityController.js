const pool = require('../config/db');

// ──────────────────────────────────────────────────────────────
// GET /api/cities
// Search, filter, and sort global destinations
// ──────────────────────────────────────────────────────────────
const getCities = async (req, res) => {
  const { q, region, country, max_cost, sort } = req.query;
  const userId = req.user ? req.user.id : null;

  try {
    let query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM activities_catalog ac WHERE ac.city_id = c.id) AS activity_count
             ${userId ? `, (SELECT COUNT(*) FROM saved_destinations sd WHERE sd.city_id = c.id AND sd.user_id = ${parseInt(userId, 10)}) > 0 AS is_saved` : ''}
      FROM cities c
      WHERE 1=1
    `;
    const params = [];

    if (q && q.trim()) {
      query += ` AND (c.name LIKE ? OR c.country LIKE ? OR c.description LIKE ?)`;
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    if (region && region.trim() && region !== 'All') {
      query += ` AND c.region = ?`;
      params.push(region.trim());
    }

    if (country && country.trim()) {
      query += ` AND c.country = ?`;
      params.push(country.trim());
    }

    if (max_cost && !isNaN(max_cost)) {
      const parsedCost = parseInt(max_cost, 10);
      if (parsedCost >= 5) {
        query += ` AND c.cost_index >= 5`;
      } else {
        query += ` AND c.cost_index <= ?`;
        params.push(parsedCost);
      }
    }

    // Sort order
    if (sort === 'cost_asc') {
      query += ` ORDER BY c.cost_index ASC, c.popularity_score DESC`;
    } else if (sort === 'cost_desc') {
      query += ` ORDER BY c.cost_index DESC, c.popularity_score DESC`;
    } else if (sort === 'name') {
      query += ` ORDER BY c.name ASC`;
    } else {
      // Default: popularity
      query += ` ORDER BY c.popularity_score DESC, c.name ASC`;
    }

    const [rows] = await pool.execute(query, params);

    res.json({
      status:  'success',
      results: rows.length,
      data:    { cities: rows },
    });
  } catch (err) {
    console.error('[getCities]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch cities.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/cities/:id
// Get single city details with activities catalog
// ──────────────────────────────────────────────────────────────
const getCityById = async (req, res) => {
  const cityId = parseInt(req.params.id, 10);
  if (isNaN(cityId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid city ID.' });
  }

  const userId = req.user ? req.user.id : null;

  try {
    const [cityRows] = await pool.execute(
      `SELECT c.*
              ${userId ? `, (SELECT COUNT(*) FROM saved_destinations sd WHERE sd.city_id = c.id AND sd.user_id = ${parseInt(userId, 10)}) > 0 AS is_saved` : ''}
       FROM cities c
       WHERE c.id = ? LIMIT 1`,
      [cityId]
    );

    if (!cityRows.length) {
      return res.status(404).json({ status: 'fail', message: 'City not found.' });
    }

    // Fetch activities catalog for this city
    const [activities] = await pool.execute(
      `SELECT * FROM activities_catalog WHERE city_id = ? ORDER BY estimated_cost ASC`,
      [cityId]
    );

    res.json({
      status: 'success',
      data: {
        city: {
          ...cityRows[0],
          activities,
        },
      },
    });
  } catch (err) {
    console.error('[getCityById]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch city details.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/cities
// Add a new custom city to the catalog (authenticated users)
// ──────────────────────────────────────────────────────────────
const createCity = async (req, res) => {
  const {
    name,
    country,
    country_code,
    region,
    cost_index,
    popularity_score,
    image_url,
    description,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ status: 'fail', message: 'City name is required.' });
  }

  const cityName = name.trim();
  const countryName = country && country.trim() ? country.trim() : 'Global Destination';
  const finalRegion = region && region.trim() ? region.trim() : 'Global';
  const finalCost = cost_index ? parseInt(cost_index, 10) : 3;
  const finalPop = popularity_score ? parseInt(popularity_score, 10) : 75;
  const defaultImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop';
  const finalImage = image_url && image_url.trim() ? image_url.trim() : defaultImage;
  const finalCode = country_code
    ? country_code.trim().toUpperCase().slice(0, 2)
    : (countryName.length >= 2 ? countryName.slice(0, 2).toUpperCase() : 'GL');

  try {
    // Check if city already exists (case-insensitive name match)
    const [existing] = await pool.execute(
      'SELECT * FROM cities WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [cityName]
    );

    if (existing.length > 0) {
      return res.status(200).json({
        status: 'success',
        message: 'City already exists in catalog.',
        data: { city: existing[0] },
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO cities (name, country, country_code, region, cost_index, popularity_score, image_url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cityName,
        countryName,
        finalCode,
        finalRegion,
        finalCost,
        finalPop,
        finalImage,
        description ? description.trim() : `Explore ${cityName}, ${countryName}.`,
      ]
    );

    const [newCity] = await pool.execute('SELECT * FROM cities WHERE id = ? LIMIT 1', [result.insertId]);

    res.status(201).json({
      status: 'success',
      data: { city: newCity[0] },
    });
  } catch (err) {
    console.error('[createCity]', err);
    res.status(500).json({ status: 'error', message: 'Failed to create city.' });
  }
};

module.exports = { getCities, getCityById, createCity };

