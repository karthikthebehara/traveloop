const Joi  = require('joi');
const pool = require('../config/db');

// ── Joi Schemas ────────────────────────────────────────────────
const stopSchema = Joi.object({
  city_id:        Joi.number().integer().positive().optional().allow(null),
  city_name:      Joi.string().trim().min(1).max(150).optional().allow('', null),
  stop_name:      Joi.string().trim().min(1).max(150).optional().allow('', null),
  country:        Joi.string().trim().max(100).optional().allow('', null),
  country_code:   Joi.string().max(10).uppercase().optional().allow('', null),
  save_to_catalog: Joi.boolean().optional().default(true),
  latitude:       Joi.number().min(-90).max(90).optional().allow(null),
  longitude:      Joi.number().min(-180).max(180).optional().allow(null),
  arrival_date:   Joi.date().iso().optional().allow(null),
  departure_date: Joi.date().iso().min(Joi.ref('arrival_date')).optional().allow(null)
                     .messages({ 'date.min': 'departure_date must not be before arrival_date.' }),
  budget:         Joi.number().min(0).optional().allow(null),
  notes:          Joi.string().max(1000).optional().allow('', null),
}).or('city_name', 'stop_name', 'city_id');

const reorderSchema = Joi.object({
  stops: Joi.array()
    .items(
      Joi.object({
        id:          Joi.number().integer().positive().required(),
        order_index: Joi.number().integer().min(0).required(),
      })
    )
    .min(1)
    .required(),
});

// ── Helper: verify trip ownership ─────────────────────────────
const verifyTripOwner = async (tripId, userId) => {
  const [rows] = await pool.execute(
    'SELECT id, sharing_status, start_date, end_date FROM trips WHERE id = ? AND user_id = ? LIMIT 1',
    [tripId, userId]
  );
  return rows[0] ?? null;
};

// ──────────────────────────────────────────────────────────────
// POST /api/trips/:tripId/stops
// Add a new city stop (from catalog OR custom user-entered city)
// ──────────────────────────────────────────────────────────────
const addStop = async (req, res) => {
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

  const { error, value } = stopSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  let {
    city_id, city_name, stop_name, country, country_code,
    save_to_catalog, latitude, longitude,
    arrival_date, departure_date, notes,
  } = value;

  // Strict date boundary validation against trip's start_date and end_date
  if (trip.start_date && arrival_date) {
    const tripStart = new Date(trip.start_date).toISOString().split('T')[0];
    const arrDate = new Date(arrival_date).toISOString().split('T')[0];
    if (arrDate < tripStart) {
      return res.status(400).json({
        status: 'fail',
        message: `Arrival date (${arrDate}) cannot be earlier than trip start date (${tripStart}).`,
      });
    }
  }

  if (trip.end_date && departure_date) {
    const tripEnd = new Date(trip.end_date).toISOString().split('T')[0];
    const depDate = new Date(departure_date).toISOString().split('T')[0];
    if (depDate > tripEnd) {
      return res.status(400).json({
        status: 'fail',
        message: `Departure date (${depDate}) cannot be after trip end date (${tripEnd}).`,
      });
    }
  }

  if (arrival_date && departure_date) {
    const arrDate = new Date(arrival_date).toISOString().split('T')[0];
    const depDate = new Date(departure_date).toISOString().split('T')[0];
    if (depDate < arrDate) {
      return res.status(400).json({
        status: 'fail',
        message: `Departure date (${depDate}) cannot be earlier than arrival date (${arrDate}).`,
      });
    }
  }

  let resolvedCityName = (city_name || stop_name || '').trim();
  let resolvedCountryCode = country_code ? country_code.trim().toUpperCase().slice(0, 2) : null;
  const countryName = country && country.trim() ? country.trim() : 'Global Destination';

  try {
    // 1. If city_id is given, ensure city_name is filled
    if (city_id) {
      const [cRows] = await pool.execute('SELECT * FROM cities WHERE id = ? LIMIT 1', [city_id]);
      if (cRows.length > 0) {
        if (!resolvedCityName) resolvedCityName = cRows[0].name;
        if (!resolvedCountryCode) resolvedCountryCode = cRows[0].country_code;
      }
    } else if (resolvedCityName) {
      // 2. Check if a city with this name already exists in the catalog
      const [match] = await pool.execute(
        'SELECT * FROM cities WHERE LOWER(name) = LOWER(?) LIMIT 1',
        [resolvedCityName]
      );

      if (match.length > 0) {
        city_id = match[0].id;
        if (!resolvedCountryCode) resolvedCountryCode = match[0].country_code;
      } else if (save_to_catalog !== false) {
        // 3. Auto-insert custom city into cities catalog
        const defaultImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop';
        const finalCode = resolvedCountryCode || (countryName.length >= 2 ? countryName.slice(0, 2).toUpperCase() : 'GL');

        try {
          const [insCity] = await pool.execute(
            `INSERT INTO cities (name, country, country_code, region, cost_index, popularity_score, image_url, description)
             VALUES (?, ?, ?, 'Global', 3, 75, ?, ?)`,
            [
              resolvedCityName,
              countryName,
              finalCode,
              defaultImage,
              `Explore ${resolvedCityName}, ${countryName}.`,
            ]
          );
          city_id = insCity.insertId;
          resolvedCountryCode = finalCode;
        } catch (catErr) {
          console.warn('[addStop] Auto-catalog city insertion note:', catErr.message);
          // Fallback if duplicate key or error: leave city_id null
          city_id = null;
        }
      }
    }

    if (!resolvedCityName) {
      resolvedCityName = 'Destination Stop';
    }

    const [[{ count }]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM stops WHERE trip_id = ?',
      [tripId]
    );
    const order_index = parseInt(count, 10);

    const [result] = await pool.execute(
      `INSERT INTO stops
         (trip_id, city_id, city_name, country_code, latitude, longitude,
          arrival_date, departure_date, order_index, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tripId, city_id ?? null, resolvedCityName, resolvedCountryCode ?? null,
        latitude ?? null, longitude ?? null,
        arrival_date ?? null, departure_date ?? null,
        order_index, notes ?? null,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT s.*, c.image_url AS city_image, c.region AS city_region, c.cost_index AS city_cost_index
       FROM stops s
       LEFT JOIN cities c ON c.id = s.city_id
       WHERE s.id = ? LIMIT 1`,
      [result.insertId]
    );

    res.status(201).json({ status: 'success', data: { stop: rows[0] } });
  } catch (err) {
    console.error('[addStop]', err);
    res.status(500).json({ status: 'error', message: 'Failed to add stop.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/:tripId/stops
// Fetch all stops for a trip, sorted by order_index
// ──────────────────────────────────────────────────────────────
const getStops = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  // Allow owner OR public trip viewers
  const [tripRows] = await pool.execute(
    'SELECT user_id, sharing_status FROM trips WHERE id = ? LIMIT 1',
    [tripId]
  );
  if (!tripRows.length) {
    return res.status(404).json({ status: 'fail', message: 'Trip not found.' });
  }
  const isOwner = req.user && tripRows[0].user_id === req.user.id;
  const isPublic = tripRows[0].sharing_status === 'public';
  if (!isOwner && !isPublic) {
    return res.status(403).json({ status: 'fail', message: 'Access denied.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT s.*, c.image_url AS city_image, c.region AS city_region, c.cost_index AS city_cost_index
       FROM stops s
       LEFT JOIN cities c ON c.id = s.city_id
       WHERE s.trip_id = ?
       ORDER BY s.order_index ASC`,
      [tripId]
    );

    res.json({
      status:  'success',
      results: rows.length,
      data:    { stops: rows },
    });
  } catch (err) {
    console.error('[getStops]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stops.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PATCH /api/trips/:tripId/stops/reorder
// Batch-update order_index
// ──────────────────────────────────────────────────────────────
const updateStopOrder = async (req, res) => {
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

  const { error, value } = reorderSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const { id, order_index } of value.stops) {
      await conn.execute(
        'UPDATE stops SET order_index = ? WHERE id = ? AND trip_id = ?',
        [order_index, id, tripId]
      );
    }

    await conn.commit();

    const [rows] = await conn.execute(
      `SELECT s.*, c.image_url AS city_image, c.region AS city_region, c.cost_index AS city_cost_index
       FROM stops s
       LEFT JOIN cities c ON c.id = s.city_id
       WHERE s.trip_id = ?
       ORDER BY s.order_index ASC`,
      [tripId]
    );

    res.json({ status: 'success', data: { stops: rows } });
  } catch (err) {
    await conn.rollback();
    console.error('[updateStopOrder]', err);
    res.status(500).json({ status: 'error', message: 'Failed to reorder stops.' });
  } finally {
    conn.release();
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/trips/:tripId/stops/:stopId
// Remove a stop
// ──────────────────────────────────────────────────────────────
const deleteStop = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const stopId = parseInt(req.params.stopId, 10);

  if (isNaN(tripId) || isNaN(stopId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID.' });
  }

  const trip = await verifyTripOwner(tripId, req.user.id);
  if (!trip) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM stops WHERE id = ? AND trip_id = ?',
      [stopId, tripId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'Stop not found.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[deleteStop]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete stop.' });
  }
};

module.exports = { addStop, getStops, updateStopOrder, deleteStop };
