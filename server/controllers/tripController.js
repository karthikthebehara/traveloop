const Joi    = require('joi');
const pool   = require('../config/db');
const crypto = require('crypto');

// ── Helper: Slugify ───────────────────────────────────────────
const generateSlug = (title) => {
  const base = (title || 'trip')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
  const rand = crypto.randomBytes(3).toString('hex');
  return `${base}-${rand}`;
};

// ── Joi Validation Schema ──────────────────────────────────────
const tripSchema = Joi.object({
  title:                  Joi.string().min(2).max(200).required(),
  description:            Joi.string().max(1000).optional().allow('', null),
  start_date:             Joi.date().iso().optional().allow(null),
  end_date:               Joi.date().iso().min(Joi.ref('start_date')).optional().allow(null)
                             .messages({ 'date.min': 'end_date must not be before start_date.' }),
  total_budget:           Joi.number().min(0).precision(2).optional().default(0),
  daily_budget_threshold: Joi.number().min(0).precision(2).optional().default(0),
  currency:               Joi.string().length(3).uppercase().optional().default('USD'),
  sharing_status:         Joi.string().valid('private', 'shared', 'public').optional().default('private'),
  share_slug:             Joi.string().max(100).optional().allow('', null),
  cover_image_url:        Joi.string().uri().optional().allow('', null),
});

// ──────────────────────────────────────────────────────────────
// POST /api/trips
// Create a new trip for the logged-in user
// ──────────────────────────────────────────────────────────────
const createTrip = async (req, res) => {
  const { error, value } = tripSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const {
    title, description, start_date, end_date,
    total_budget, daily_budget_threshold, currency,
    sharing_status, share_slug, cover_image_url,
  } = value;

  const user_id = req.user.id;
  const finalSlug = share_slug || generateSlug(title);

  try {
    const [result] = await pool.execute(
      `INSERT INTO trips
         (user_id, title, description, start_date, end_date,
          total_budget, daily_budget_threshold, currency, sharing_status, share_slug, cover_image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, title, description ?? null,
        start_date ?? null, end_date ?? null,
        total_budget, daily_budget_threshold || 0,
        currency, sharing_status, finalSlug, cover_image_url ?? null,
      ]
    );

    const tripId = result.insertId;

    const [rows] = await pool.execute(
      'SELECT * FROM trips WHERE id = ? LIMIT 1',
      [tripId]
    );

    res.status(201).json({
      status:  'success',
      tripId,
      data:    { trip: rows[0] },
    });
  } catch (err) {
    console.error('[createTrip]', err);
    res.status(500).json({ status: 'error', message: 'Failed to create trip.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips
// Fetch all trips owned by the logged-in user with stop counts & spent
// ──────────────────────────────────────────────────────────────
const getAllTrips = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT t.*,
              (SELECT COUNT(*) FROM stops s WHERE s.trip_id = t.id) AS stop_count,
              ROUND(
                (SELECT COALESCE(SUM(a.cost), 0) FROM activities a INNER JOIN stops s ON s.id = a.stop_id WHERE s.trip_id = t.id) +
                (SELECT COALESCE(SUM(te.amount), 0) FROM trip_expenses te WHERE te.trip_id = t.id),
                2
              ) AS total_spent
       FROM trips t
       WHERE t.user_id = ?
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    res.json({
      status:  'success',
      results: rows.length,
      data:    { trips: rows },
    });
  } catch (err) {
    console.error('[getAllTrips]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch trips.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/:id
// Fetch a single trip — enforces ownership check
// ──────────────────────────────────────────────────────────────
const getTripById = async (req, res) => {
  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT t.*,
              (SELECT COUNT(*) FROM stops s WHERE s.trip_id = t.id) AS stop_count,
              ROUND(
                (SELECT COALESCE(SUM(a.cost), 0) FROM activities a INNER JOIN stops s ON s.id = a.stop_id WHERE s.trip_id = t.id) +
                (SELECT COALESCE(SUM(te.amount), 0) FROM trip_expenses te WHERE te.trip_id = t.id),
                2
              ) AS total_spent
       FROM trips t
       WHERE t.id = ? LIMIT 1`,
      [tripId]
    );

    if (!rows.length) {
      return res.status(404).json({ status: 'fail', message: 'Trip not found.' });
    }

    const trip = rows[0];

    // Ownership guard: allow if owner OR public
    if (trip.user_id !== req.user.id && trip.sharing_status !== 'public') {
      return res.status(403).json({
        status:  'fail',
        message: 'You do not have permission to view this trip.',
      });
    }

    res.json({ status: 'success', data: { trip } });
  } catch (err) {
    console.error('[getTripById]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch trip.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/trips/:id
// Update a trip — enforces ownership check
// ──────────────────────────────────────────────────────────────
const updateTrip = async (req, res) => {
  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const { error, value } = tripSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT user_id, share_slug FROM trips WHERE id = ? LIMIT 1',
      [tripId]
    );
    if (!existing.length) {
      return res.status(404).json({ status: 'fail', message: 'Trip not found.' });
    }
    if (existing[0].user_id !== req.user.id) {
      return res.status(403).json({
        status:  'fail',
        message: 'You do not have permission to update this trip.',
      });
    }

    const {
      title, description, start_date, end_date,
      total_budget, daily_budget_threshold, currency,
      sharing_status, share_slug, cover_image_url,
    } = value;

    const finalSlug = share_slug || existing[0].share_slug || generateSlug(title);

    await pool.execute(
      `UPDATE trips
       SET title = ?, description = ?, start_date = ?, end_date = ?,
           total_budget = ?, daily_budget_threshold = ?, currency = ?,
           sharing_status = ?, share_slug = ?, cover_image_url = ?
       WHERE id = ?`,
      [
        title, description ?? null,
        start_date ?? null, end_date ?? null,
        total_budget, daily_budget_threshold || 0, currency,
        sharing_status, finalSlug,
        cover_image_url ?? null, tripId,
      ]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM trips WHERE id = ? LIMIT 1',
      [tripId]
    );

    res.json({ status: 'success', data: { trip: updated[0] } });
  } catch (err) {
    console.error('[updateTrip]', err);
    res.status(500).json({ status: 'error', message: 'Failed to update trip.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/trips/:id
// Delete a trip
// ──────────────────────────────────────────────────────────────
const deleteTrip = async (req, res) => {
  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT user_id FROM trips WHERE id = ? LIMIT 1',
      [tripId]
    );
    if (!existing.length) {
      return res.status(404).json({ status: 'fail', message: 'Trip not found.' });
    }
    if (existing[0].user_id !== req.user.id) {
      return res.status(403).json({
        status:  'fail',
        message: 'You do not have permission to delete this trip.',
      });
    }

    await pool.execute('DELETE FROM trips WHERE id = ?', [tripId]);
    res.status(204).send();
  } catch (err) {
    console.error('[deleteTrip]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete trip.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/trips/copy/:id
// Deep clone a trip into the authenticated user's account
// ──────────────────────────────────────────────────────────────
const copyTrip = async (req, res) => {
  const sourceTripId = parseInt(req.params.id, 10);
  if (isNaN(sourceTripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid source trip ID.' });
  }

  const currentUserId = req.user.id;

  try {
    // 1. Fetch source trip (must exist and either be public or belong to requester)
    const [sourceTrips] = await pool.execute(
      'SELECT * FROM trips WHERE id = ? AND (sharing_status = "public" OR user_id = ?) LIMIT 1',
      [sourceTripId, currentUserId]
    );

    if (!sourceTrips.length) {
      return res.status(404).json({
        status:  'fail',
        message: 'Trip not found or is private.',
      });
    }

    const src = sourceTrips[0];
    const newTitle = `Copy of ${src.title}`.slice(0, 200);
    const newSlug  = generateSlug(newTitle);

    // 2. Clone Master Trip
    const [newTripResult] = await pool.execute(
      `INSERT INTO trips (
        user_id, title, description, start_date, end_date, total_budget, daily_budget_threshold,
        currency, sharing_status, share_slug, cover_image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'private', ?, ?)`,
      [
        currentUserId, newTitle, src.description, src.start_date, src.end_date,
        src.total_budget, src.daily_budget_threshold || 0, src.currency, newSlug, src.cover_image_url
      ]
    );

    const newTripId = newTripResult.insertId;

    // 3. Clone Stops & their Activities
    const [stops] = await pool.execute(
      'SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index ASC',
      [sourceTripId]
    );

    for (const stop of stops) {
      const [newStopResult] = await pool.execute(
        `INSERT INTO stops (
          trip_id, city_id, city_name, country_code, latitude, longitude,
          arrival_date, departure_date, order_index, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newTripId, stop.city_id, stop.city_name, stop.country_code,
          stop.latitude, stop.longitude, stop.arrival_date, stop.departure_date,
          stop.order_index, stop.notes
        ]
      );

      const newStopId = newStopResult.insertId;

      // Copy activities for this stop
      const [acts] = await pool.execute(
        'SELECT * FROM activities WHERE stop_id = ?',
        [stop.id]
      );

      for (const act of acts) {
        await pool.execute(
          `INSERT INTO activities (
            stop_id, activity_id, title, description, category, cost,
            scheduled_date, duration_hours, start_time, end_time, location_name, is_booked
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newStopId, act.activity_id, act.title, act.description, act.category, act.cost,
            act.scheduled_date, act.duration_hours, act.start_time, act.end_time, act.location_name, 0
          ]
        );
      }
    }

    // 4. Clone Packing Items
    const [items] = await pool.execute(
      'SELECT * FROM packing_checklist WHERE trip_id = ?',
      [sourceTripId]
    );

    for (const item of items) {
      await pool.execute(
        `INSERT INTO packing_checklist (trip_id, item_name, category, quantity, is_packed)
         VALUES (?, ?, ?, ?, 0)`,
        [newTripId, item.item_name, item.category, item.quantity]
      );
    }

    // Fetch newly created trip
    const [newTripRows] = await pool.execute('SELECT * FROM trips WHERE id = ? LIMIT 1', [newTripId]);

    res.status(201).json({
      status:    'success',
      message:   'Trip copied successfully!',
      newTripId: newTripId,
      data:      { trip: newTripRows[0] },
    });
  } catch (err) {
    console.error('[copyTrip]', err);
    res.status(500).json({ status: 'error', message: 'Failed to copy trip.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/community
// Return public trips for the social community feed
// ──────────────────────────────────────────────────────────────
const getCommunityTrips = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT t.*,
              u.name AS creator_name,
              u.avatar_url AS creator_avatar,
              u.city AS creator_city,
              u.country AS creator_country,
              (SELECT COUNT(*) FROM stops s WHERE s.trip_id = t.id) AS stop_count,
              (SELECT COUNT(*) FROM activities a INNER JOIN stops st ON st.id = a.stop_id WHERE st.trip_id = t.id) AS activity_count
       FROM trips t
       INNER JOIN users u ON u.id = t.user_id
       WHERE t.sharing_status = 'public'
       ORDER BY t.created_at DESC`
    );

    res.json({
      status:  'success',
      results: rows.length,
      data:    { trips: rows },
    });
  } catch (err) {
    console.error('[getCommunityTrips]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch community trips.' });
  }
};

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  copyTrip,
  getCommunityTrips,
};
