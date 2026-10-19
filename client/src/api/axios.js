import axios from 'axios';

/**
 * Pre-configured Axios instance for the Traveloop API.
 *
 * Automatically resolves the base URL and attaches authentication tokens.
 * Normalizes paths to guarantee that double '/api/api' paths can NEVER occur,
 * whether VITE_API_URL is supplied with or without a trailing '/api'.
 */
const resolveBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();

  // If no env variable is provided:
  // - Local dev defaults to http://localhost:5000/api
  // - Production fallback uses relative /api (handled via vercel.json rewrite)
  if (!envUrl) {
    return import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
  }

  // Remove any trailing slashes (e.g., 'https://api.example.com/' -> 'https://api.example.com')
  const trimmed = envUrl.replace(/\/+$/, '');

  // If it already ends with /api, use it as is
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }

  // Otherwise append /api
  return `${trimmed}/api`;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach token & guard against double /api ──────────
api.interceptors.request.use(
  (config) => {
    // If a caller passes '/api/users' instead of '/users', strip the leading '/api'
    // because baseURL already includes the '/api' prefix.
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }

    const token = localStorage.getItem('traveloop_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem('traveloop_token');
      localStorage.removeItem('token');
      localStorage.removeItem('traveloop_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
