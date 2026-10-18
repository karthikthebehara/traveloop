const Joi  = require('joi');
const pool = require('../config/db');

// ── Joi Schema ─────────────────────────────────────────────────
const noteSchema = Joi.object({
  trip_stop_id: Joi.number().integer().positive().optional().allow(null),
  note_date:    Joi.date().iso().optional().allow(null),
  title:        Joi.string().trim().max(200).optional().allow('', null),
  content:      Joi.string().trim().min(1).max(5000).required()
                  .messages({ 'string.empty': 'Note content must not be empty.' }),
});

// ── Helper: verify trip ownership ─────────────────────────────
const verifyTripOwner = async (tripId, userId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM trips WHERE id = ? AND user_id = ? LIMIT 1',
    [tripId, userId]
  );
  return rows.length > 0;
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/:tripId/notes
// List all notes for a trip, sorted by note_date/created_at
// ──────────────────────────────────────────────────────────────
const getNotes = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const owns = await verifyTripOwner(tripId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT tn.*, s.city_name
       FROM trip_notes tn
       LEFT JOIN stops s ON s.id = tn.trip_stop_id
       WHERE tn.trip_id = ?
       ORDER BY COALESCE(tn.note_date, DATE(tn.created_at)) DESC, tn.created_at DESC`,
      [tripId]
    );
    res.json({ status: 'success', results: rows.length, data: { notes: rows } });
  } catch (err) {
    console.error('[getNotes]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch notes.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/trips/:tripId/notes
// Create a new note
// ──────────────────────────────────────────────────────────────
const createNote = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const owns = await verifyTripOwner(tripId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  const { error, value } = noteSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const { trip_stop_id, note_date, title, content } = value;

  try {
    const [result] = await pool.execute(
      `INSERT INTO trip_notes (trip_id, trip_stop_id, note_date, title, content)
       VALUES (?, ?, ?, ?, ?)`,
      [tripId, trip_stop_id ?? null, note_date ?? null, title ?? null, content]
    );

    const [rows] = await pool.execute(
      `SELECT tn.*, s.city_name
       FROM trip_notes tn
       LEFT JOIN stops s ON s.id = tn.trip_stop_id
       WHERE tn.id = ? LIMIT 1`,
      [result.insertId]
    );

    res.status(201).json({ status: 'success', data: { note: rows[0] } });
  } catch (err) {
    console.error('[createNote]', err);
    res.status(500).json({ status: 'error', message: 'Failed to create note.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/trips/:tripId/notes/:noteId
// Update a note
// ──────────────────────────────────────────────────────────────
const updateNote = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const noteId = parseInt(req.params.noteId, 10);

  if (isNaN(tripId) || isNaN(noteId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID.' });
  }

  const owns = await verifyTripOwner(tripId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  const { error, value } = noteSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const { trip_stop_id, note_date, title, content } = value;

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM trip_notes WHERE id = ? AND trip_id = ? LIMIT 1',
      [noteId, tripId]
    );

    if (!existing.length) {
      return res.status(404).json({ status: 'fail', message: 'Note not found.' });
    }

    await pool.execute(
      `UPDATE trip_notes
       SET trip_stop_id = ?, note_date = ?, title = ?, content = ?
       WHERE id = ? AND trip_id = ?`,
      [trip_stop_id ?? null, note_date ?? null, title ?? null, content, noteId, tripId]
    );

    const [rows] = await pool.execute(
      `SELECT tn.*, s.city_name
       FROM trip_notes tn
       LEFT JOIN stops s ON s.id = tn.trip_stop_id
       WHERE tn.id = ? LIMIT 1`,
      [noteId]
    );

    res.json({ status: 'success', data: { note: rows[0] } });
  } catch (err) {
    console.error('[updateNote]', err);
    res.status(500).json({ status: 'error', message: 'Failed to update note.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/trips/:tripId/notes/:noteId
// ──────────────────────────────────────────────────────────────
const deleteNote = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const noteId = parseInt(req.params.noteId, 10);

  if (isNaN(tripId) || isNaN(noteId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID.' });
  }

  const owns = await verifyTripOwner(tripId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM trip_notes WHERE id = ? AND trip_id = ?',
      [noteId, tripId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'Note not found.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[deleteNote]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete note.' });
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
