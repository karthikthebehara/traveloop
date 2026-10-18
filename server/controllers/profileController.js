const Joi    = require('joi');
const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

// ── Joi Schema ─────────────────────────────────────────────────
const updateProfileSchema = Joi.object({
  name:                Joi.string().min(1).max(120).optional().allow('', null),
  first_name:          Joi.string().max(100).optional().allow('', null),
  last_name:           Joi.string().max(100).optional().allow('', null),
  email:               Joi.string().email().optional(),
  phone:               Joi.string().max(50).optional().allow('', null),
  city:                Joi.string().max(100).optional().allow('', null),
  country:             Joi.string().max(100).optional().allow('', null),
  bio:                 Joi.string().max(2000).optional().allow('', null),
  avatar_url:          Joi.string().optional().allow('', null),
  language_preference: Joi.string().valid('en', 'fr', 'es', 'de', 'it', 'ja').optional(),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().min(6).required(),
  new_password:     Joi.string().min(6).max(128).required(),
});

// ──────────────────────────────────────────────────────────────
// GET /api/profile
// Return the logged-in user's profile
// ──────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, first_name, last_name, email, phone, city, country, bio, avatar_url, role, language_preference, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    // Attach trip count
    const [[{ trip_count }]] = await pool.execute(
      'SELECT COUNT(*) AS trip_count FROM trips WHERE user_id = ?',
      [req.user.id]
    );

    // Attach saved destinations count
    const [[{ saved_count }]] = await pool.execute(
      'SELECT COUNT(*) AS saved_count FROM saved_destinations WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      status: 'success',
      data: { user: { ...rows[0], trip_count, saved_count } },
    });
  } catch (err) {
    console.error('[getProfile]', err);
    res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/profile
// Update name, email, avatar_url, and language_preference
// ──────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  if (Object.keys(value).length === 0) {
    return res.status(400).json({ status: 'fail', message: 'No fields to update.' });
  }

  try {
    if (value.email) {
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
        [value.email, req.user.id]
      );
      if (existing.length) {
        return res.status(409).json({
          status:  'fail',
          message: 'This email is already in use by another account.',
        });
      }
    }

    const fields = Object.keys(value).map((k) => `${k} = ?`).join(', ');
    const vals   = [...Object.values(value), req.user.id];

    await pool.execute(`UPDATE users SET ${fields} WHERE id = ?`, vals);

    const [rows] = await pool.execute(
      'SELECT id, name, first_name, last_name, email, phone, city, country, bio, avatar_url, role, language_preference, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    res.json({ status: 'success', data: { user: rows[0] } });
  } catch (err) {
    console.error('[updateProfile]', err);
    res.status(500).json({ status: 'error', message: 'Failed to update profile.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/profile/password
// Change password
// ──────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  const { error, value } = changePasswordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const { current_password, new_password } = value;

  try {
    const [rows] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({
        status:  'fail',
        message: 'Current password is incorrect.',
      });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newHash, req.user.id]
    );

    res.json({ status: 'success', message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[changePassword]', err);
    res.status(500).json({ status: 'error', message: 'Failed to change password.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/profile
// Delete user account — ON DELETE CASCADE purges all user data
// ──────────────────────────────────────────────────────────────
const deleteAccount = async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.status(204).send();
  } catch (err) {
    console.error('[deleteAccount]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete account.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/profile/saved-destinations
// Get all cities saved/bookmarked by the user
// ──────────────────────────────────────────────────────────────
const getSavedDestinations = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, sd.created_at AS saved_at
       FROM saved_destinations sd
       INNER JOIN cities c ON c.id = sd.city_id
       WHERE sd.user_id = ?
       ORDER BY sd.created_at DESC`,
      [req.user.id]
    );

    res.json({
      status:  'success',
      results: rows.length,
      data:    { destinations: rows },
    });
  } catch (err) {
    console.error('[getSavedDestinations]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch saved destinations.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/profile/saved-destinations
// Bookmark a city
// ──────────────────────────────────────────────────────────────
const saveDestination = async (req, res) => {
  const cityId = parseInt(req.body.city_id, 10);
  if (isNaN(cityId)) {
    return res.status(400).json({ status: 'fail', message: 'Valid city_id is required.' });
  }

  try {
    // Verify city exists
    const [city] = await pool.execute('SELECT id, name FROM cities WHERE id = ? LIMIT 1', [cityId]);
    if (!city.length) {
      return res.status(404).json({ status: 'fail', message: 'City not found.' });
    }

    await pool.execute(
      'INSERT IGNORE INTO saved_destinations (user_id, city_id) VALUES (?, ?)',
      [req.user.id, cityId]
    );

    res.status(201).json({
      status:  'success',
      message: `${city[0].name} bookmarked to saved destinations.`,
    });
  } catch (err) {
    console.error('[saveDestination]', err);
    res.status(500).json({ status: 'error', message: 'Failed to save destination.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/profile/saved-destinations/:cityId
// Remove a bookmarked city
// ──────────────────────────────────────────────────────────────
const removeSavedDestination = async (req, res) => {
  const cityId = parseInt(req.params.cityId, 10);
  if (isNaN(cityId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid city ID.' });
  }

  try {
    await pool.execute(
      'DELETE FROM saved_destinations WHERE user_id = ? AND city_id = ?',
      [req.user.id, cityId]
    );

    res.json({ status: 'success', message: 'Destination removed from saved list.' });
  } catch (err) {
    console.error('[removeSavedDestination]', err);
    res.status(500).json({ status: 'error', message: 'Failed to remove destination.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getSavedDestinations,
  saveDestination,
  removeSavedDestination,
};
