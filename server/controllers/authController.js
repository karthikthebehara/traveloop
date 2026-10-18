const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const Joi     = require('joi');
const pool    = require('../config/db');
const { sendPasswordResetEmail } = require('../utils/mailer');

// ── Joi Validation Schemas ─────────────────────────────────────
const registerSchema = Joi.object({
  name:       Joi.string().min(1).max(120).optional().allow('', null),
  first_name: Joi.string().max(100).optional().allow('', null),
  last_name:  Joi.string().max(100).optional().allow('', null),
  email:      Joi.string().email().required(),
  password:   Joi.string().min(6).max(128).required(),
  phone:      Joi.string().max(50).optional().allow('', null),
  city:       Joi.string().max(100).optional().allow('', null),
  country:    Joi.string().max(100).optional().allow('', null),
  bio:        Joi.string().max(2000).optional().allow('', null),
  avatar_url: Joi.string().optional().allow('', null),
  role:       Joi.string().valid('user', 'admin').optional().default('user'),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const forgotPasswordSchema = Joi.object({
  email:        Joi.string().email().required(),
  new_password: Joi.string().min(6).max(128).required(),
});

// ── Helper: Sign JWT ───────────────────────────────────────────
const signToken = (userId, role = 'user') =>
  jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── Helper: Safe user response ─────────────────────────────────
const sanitizeUser = (user) => ({
  id:                  user.id,
  name:                user.name,
  first_name:          user.first_name || null,
  last_name:           user.last_name || null,
  email:               user.email,
  phone:               user.phone || null,
  city:                user.city || null,
  country:             user.country || null,
  bio:                 user.bio || null,
  avatar_url:          user.avatar_url || null,
  role:                user.role || 'user',
  language_preference: user.language_preference || 'en',
  created_at:          user.created_at,
});

// ──────────────────────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status:  'fail',
      errors:  error.details.map((d) => d.message),
    });
  }

  let { name, first_name, last_name, email, password, phone, city, country, bio, avatar_url, role } = value;

  if (!name || !name.trim()) {
    if (first_name || last_name) {
      name = `${first_name || ''} ${last_name || ''}`.trim();
    } else {
      name = email.split('@')[0];
    }
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        status:  'fail',
        message: 'An account with this email already exists.',
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users 
         (name, first_name, last_name, email, password_hash, phone, city, country, bio, avatar_url, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        first_name || null,
        last_name || null,
        email,
        password_hash,
        phone || null,
        city || null,
        country || null,
        bio || null,
        avatar_url || null,
        email.toLowerCase() === 'admin@traveloop.com' ? 'admin' : 'user',
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    const user  = rows[0];
    const token = signToken(user.id, user.role);

    res.status(201).json({
      status: 'success',
      token,
      data:   { user: sanitizeUser(user) },
    });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ status: 'error', message: 'Server error during registration.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const { email, password } = value;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    const user = rows[0];
    const isMatch = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !isMatch) {
      return res.status(401).json({
        status:  'fail',
        message: 'Invalid email or password.',
      });
    }

    const token = signToken(user.id, user.role);

    res.json({
      status: 'success',
      token,
      data:   { user: sanitizeUser(user) },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ status: 'error', message: 'Server error during login.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ──────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { error, value } = forgotPasswordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const { email, new_password } = value;

  try {
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!rows.length) {
      return res.status(404).json({
        status:  'fail',
        message: 'No account found with this email address.',
      });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newHash, rows[0].id]
    );

    // Send confirmation/reset email via mailer helper
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    sendPasswordResetEmail({
      to: email,
      resetUrl: `${clientUrl}/login`,
    }).catch(err => console.warn('[forgotPassword mail warning]', err.message));

    res.json({
      status:  'success',
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    console.error('[forgotPassword]', err);
    res.status(500).json({ status: 'error', message: 'Failed to reset password.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/auth/me
// ──────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }
    res.json({ status: 'success', data: { user: sanitizeUser(rows[0]) } });
  } catch (err) {
    console.error('[getMe]', err);
    res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};

module.exports = { register, login, forgotPassword, getMe };
