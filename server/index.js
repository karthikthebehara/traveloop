require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const pool    = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (for HTTPS detection behind Load Balancers / Nginx / Cloudflare)
app.set('trust proxy', 1);

// Automatic HTTP-to-HTTPS redirect middleware in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// ── Production Security Headers (Helmet) ────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Prevents blocking of frontend CDN assets and external map/image providers
  crossOriginEmbedderPolicy: false,
}));

// ── Strict Production CORS ─────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://traveloop.com',
  'https://www.traveloop.com',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health / DB Test Route ─────────────────────────────────────
app.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({
      status:  'ok',
      message: 'Traveloop API is running',
      db_test: rows[0].result,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',               require('./routes/authRoutes'));
app.use('/api/profile',            require('./routes/profileRoutes'));
app.use('/api/cities',             require('./routes/cityRoutes'));
app.use('/api/activities-catalog', require('./routes/catalogRoutes'));
app.use('/api/admin',              require('./routes/adminRoutes'));

// Budget router first — catches /api/trips/public/:tripId and /expenses BEFORE
// tripRoutes can swallow 'public' or 'expenses' as a /:id param
app.use('/api/trips',  require('./routes/budgetRoutes'));
app.use('/api/trips',  require('./routes/tripRoutes'));
app.use('/api/trips/:tripId/stops',      require('./routes/stopRoutes'));
app.use('/api/trips/:tripId/checklist',  require('./routes/checklistRoutes'));
app.use('/api/trips/:tripId/notes',      require('./routes/notesRoutes'));
app.use('/api/stops/:stopId/activities', require('./routes/activityRoutes'));

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status:  'error',
    message: err.message || 'Internal Server Error',
  });
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Traveloop Server] Running on http://localhost:${PORT}`);
});
