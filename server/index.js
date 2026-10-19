require('dotenv').config();
const express           = require('express');
const cors              = require('cors');
const helmet            = require('helmet');
const pool              = require('./config/db');
const bootstrapDatabase = require('./utils/bootstrapDb');

const app  = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (for HTTPS detection behind Load Balancers / Render / Cloudflare)
app.set('trust proxy', 1);

// ── Production Security Headers (Helmet) ────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Prevents blocking of frontend CDN assets and external map/image providers
  crossOriginEmbedderPolicy: false,
}));

// ── CORS Configuration (Explicit Vercel & Preview URL support) ──
const allowedOrigins = [
  'https://traveloop-lime.vercel.app',
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://traveloop.com',
  'https://www.traveloop.com',
].filter(Boolean);

const isOriginAllowed = (origin) => {
  // Allow non-browser requests (Postman, curl, health checks)
  if (!origin) return true;

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    return true;
  }

  // Allow any *.vercel.app domain (including preview URLs)
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)?vercel\.app$/.test(origin) || origin.endsWith('.vercel.app')) {
    return true;
  }

  // Allow localhost on any port
  if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Non-whitelisted origin: ${origin} (permitting for demo)`);
      callback(null, true); // Permit to avoid lockouts during hackathon/demo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Database Diagnostic & Health Check Endpoint ─────────────────
const healthCheckHandler = async (req, res) => {
  try {
    const [testRows] = await pool.query('SELECT 1 + 1 AS result');
    const [userRows] = await pool.query('SELECT COUNT(*) AS count FROM users');
    const [cityRows] = await pool.query('SELECT COUNT(*) AS count FROM cities');
    const [tripRows] = await pool.query('SELECT COUNT(*) AS count FROM trips');

    res.json({
      status:       'ok',
      message:      'Traveloop API is running smoothly',
      db:           'connected',
      db_test:      testRows[0]?.result,
      users_count:  userRows[0]?.count,
      cities_count: cityRows[0]?.count,
      trips_count:  tripRows[0]?.count,
      timestamp:    new Date().toISOString(),
      environment:  process.env.NODE_ENV || 'development',
    });
  } catch (err) {
    console.error('[Health Check DB Error]:', err);
    res.status(500).json({
      status:       'error',
      message:      'Traveloop API is running, but database connection failed',
      db:           'disconnected',
      db_error:     err.message,
      code:         err.code,
      hint:         'Verify DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME, or DATABASE_URL in Render environment variables',
      timestamp:    new Date().toISOString(),
    });
  }
};

app.get('/', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// ── API Routes ──────────────────────────────────────────────────
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

// ── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ── Global Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack || err);
  res.status(err.status || 500).json({
    status:  'error',
    message: err.message || 'Internal Server Error',
  });
});

// ── Server Bootstrap & Boot ─────────────────────────────────────
const startServer = async () => {
  try {
    await bootstrapDatabase();
    console.log('[Traveloop Server] Production database bootstrap completed.');
  } catch (err) {
    console.error('[Startup DB Bootstrap Warning]:', err.message);
    console.error('[Startup DB Bootstrap Warning] Server will still start so /api/health can report errors.');
  }

  app.listen(PORT, () => {
    console.log(`[Traveloop Server] Running on http://localhost:${PORT}`);
  });
};

startServer();
