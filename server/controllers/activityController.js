const Joi  = require('joi');
const pool = require('../config/db');

// ── Joi Schema ─────────────────────────────────────────────────
const activitySchema = Joi.object({
  activity_id:    Joi.number().integer().positive().optional().allow(null),
  title:          Joi.string().trim().min(1).max(200).required(),
  description:    Joi.string().max(1000).optional().allow('', null),
  category:       Joi.string()
                    .valid('sightseeing','food','transport','accommodation','adventure','shopping','other')
                    .optional()
                    .default('other'),
  cost:           Joi.number().min(0).precision(2).optional().default(0),
  scheduled_date: Joi.date().iso().optional().allow(null),
  duration_hours: Joi.number().min(0).max(48).precision(1).optional().default(1.0),
  start_time:     Joi.date().iso().optional().allow(null),
  end_time:       Joi.date().iso().min(Joi.ref('start_time')).optional().allow(null)
                    .messages({ 'date.min': 'end_time must not be before start_time.' }),
  location_name:  Joi.string().max(200).optional().allow('', null),
  booking_ref:    Joi.string().max(100).optional().allow('', null),
  is_booked:      Joi.boolean().optional().default(false),
});

// ── Helper: verify stop belongs to a trip owned by the user ───
const verifyStopOwner = async (stopId, userId) => {
  const [rows] = await pool.execute(
    `SELECT s.id, s.arrival_date, s.departure_date, t.id AS trip_id, t.sharing_status, t.user_id, t.start_date, t.end_date
     FROM stops s
     INNER JOIN trips t ON t.id = s.trip_id
     WHERE s.id = ? LIMIT 1`,
    [stopId]
  );
  if (!rows.length) return null;
  return rows[0];
};

const validateActivityDate = (stop, scheduled_date) => {
  if (!scheduled_date) return null;
  const actDateStr = new Date(scheduled_date).toISOString().split('T')[0];

  const minDate = stop.arrival_date ? new Date(stop.arrival_date).toISOString().split('T')[0]
                : (stop.start_date ? new Date(stop.start_date).toISOString().split('T')[0] : null);
  const maxDate = stop.departure_date ? new Date(stop.departure_date).toISOString().split('T')[0]
                : (stop.end_date ? new Date(stop.end_date).toISOString().split('T')[0] : null);

  if (minDate && actDateStr < minDate) {
    return `Activity scheduled date (${actDateStr}) cannot be earlier than ${stop.arrival_date ? 'stop arrival date' : 'trip start date'} (${minDate}).`;
  }
  if (maxDate && actDateStr > maxDate) {
    return `Activity scheduled date (${actDateStr}) cannot be after ${stop.departure_date ? 'stop departure date' : 'trip end date'} (${maxDate}).`;
  }
  return null;
};

// ──────────────────────────────────────────────────────────────
// POST /api/stops/:stopId/activities
// Add an activity to a city stop
// ──────────────────────────────────────────────────────────────
const addActivity = async (req, res) => {
  const stopId = parseInt(req.params.stopId, 10);
  if (isNaN(stopId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid stop ID.' });
  }

  const stop = await verifyStopOwner(stopId, req.user.id);
  if (!stop || stop.user_id !== req.user.id) {
    return res.status(403).json({
      status:  'fail',
      message: 'Stop not found or you do not have permission.',
    });
  }

  // Pre-fill from catalog if activity_id is provided and title is missing
  let body = { ...req.body };
  if (body.activity_id && !body.title) {
    const [catRows] = await pool.execute('SELECT * FROM activities_catalog WHERE id = ? LIMIT 1', [body.activity_id]);
    if (catRows.length) {
      const cat = catRows[0];
      body.title = cat.name;
      body.description = body.description || cat.description;
      body.category = body.category || cat.category;
      body.cost = body.cost !== undefined ? body.cost : parseFloat(cat.estimated_cost);
      body.duration_hours = body.duration_hours || parseFloat(cat.duration_hours);
    }
  }

  const { error, value } = activitySchema.validate(body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const {
    activity_id, title, description, category, cost,
    scheduled_date, duration_hours,
    start_time, end_time, location_name, booking_ref, is_booked,
  } = value;

  // Strict date boundary validation
  const dateErr = validateActivityDate(stop, scheduled_date);
  if (dateErr) {
    return res.status(400).json({ status: 'fail', message: dateErr });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO activities
         (stop_id, activity_id, title, description, category, cost,
          scheduled_date, duration_hours, start_time, end_time, location_name, booking_ref, is_booked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stopId, activity_id ?? null, title, description ?? null, category, cost,
        scheduled_date ?? null, duration_hours ?? 1.0,
        start_time ?? null, end_time ?? null,
        location_name ?? null, booking_ref ?? null,
        is_booked ? 1 : 0,
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM activities WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    res.status(201).json({ status: 'success', data: { activity: rows[0] } });
  } catch (err) {
    console.error('[addActivity]', err);
    res.status(500).json({ status: 'error', message: 'Failed to add activity.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/stops/:stopId/activities
// List all activities for a stop
// ──────────────────────────────────────────────────────────────
const getActivities = async (req, res) => {
  const stopId = parseInt(req.params.stopId, 10);
  if (isNaN(stopId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid stop ID.' });
  }

  const stop = await verifyStopOwner(stopId, req.user ? req.user.id : 0);
  if (!stop) {
    return res.status(404).json({ status: 'fail', message: 'Stop not found.' });
  }

  const isOwner = req.user && stop.user_id === req.user.id;
  const isPublic = stop.sharing_status === 'public';
  if (!isOwner && !isPublic) {
    return res.status(403).json({ status: 'fail', message: 'Access denied.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM activities
       WHERE stop_id = ?
       ORDER BY scheduled_date ASC, start_time ASC, id ASC`,
      [stopId]
    );

    res.json({
      status:  'success',
      results: rows.length,
      data:    { activities: rows },
    });
  } catch (err) {
    console.error('[getActivities]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch activities.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/stops/:stopId/activities/:activityId
// ──────────────────────────────────────────────────────────────
const updateActivity = async (req, res) => {
  const stopId     = parseInt(req.params.stopId, 10);
  const activityId = parseInt(req.params.activityId, 10);

  if (isNaN(stopId) || isNaN(activityId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID.' });
  }

  const stop = await verifyStopOwner(stopId, req.user.id);
  if (!stop || stop.user_id !== req.user.id) {
    return res.status(403).json({ status: 'fail', message: 'Access denied.' });
  }

  const { error, value } = activitySchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const {
    activity_id, title, description, category, cost,
    scheduled_date, duration_hours,
    start_time, end_time, location_name, booking_ref, is_booked,
  } = value;

  // Strict date boundary validation
  const dateErr = validateActivityDate(stop, scheduled_date);
  if (dateErr) {
    return res.status(400).json({ status: 'fail', message: dateErr });
  }

  try {
    await pool.execute(
      `UPDATE activities
       SET activity_id = ?, title = ?, description = ?, category = ?, cost = ?,
           scheduled_date = ?, duration_hours = ?, start_time = ?, end_time = ?,
           location_name = ?, booking_ref = ?, is_booked = ?
       WHERE id = ? AND stop_id = ?`,
      [
        activity_id ?? null, title, description ?? null, category, cost,
        scheduled_date ?? null, duration_hours ?? 1.0,
        start_time ?? null, end_time ?? null,
        location_name ?? null, booking_ref ?? null,
        is_booked ? 1 : 0,
        activityId, stopId,
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM activities WHERE id = ? LIMIT 1',
      [activityId]
    );

    res.json({ status: 'success', data: { activity: rows[0] } });
  } catch (err) {
    console.error('[updateActivity]', err);
    res.status(500).json({ status: 'error', message: 'Failed to update activity.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/stops/:stopId/activities/:activityId
// ──────────────────────────────────────────────────────────────
const deleteActivity = async (req, res) => {
  const stopId     = parseInt(req.params.stopId, 10);
  const activityId = parseInt(req.params.activityId, 10);

  if (isNaN(stopId) || isNaN(activityId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID.' });
  }

  const stop = await verifyStopOwner(stopId, req.user.id);
  if (!stop || stop.user_id !== req.user.id) {
    return res.status(403).json({ status: 'fail', message: 'Access denied.' });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM activities WHERE id = ? AND stop_id = ?',
      [activityId, stopId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'Activity not found.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[deleteActivity]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete activity.' });
  }
};

module.exports = { addActivity, getActivities, updateActivity, deleteActivity };
