import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Plane, Home, Map, Globe, Compass, Activity, CheckSquare, DollarSign,
  BookOpen, BarChart3, Users, Shield, LogOut, User as UserIcon, Lock,
  Key, AlertCircle, Check, ArrowRight, Upload, X, Menu
} from 'lucide-react';
import api from './api/axios';
import { compressImageFile } from './utils/imageCompressor';
import { initGA, trackPageView } from './utils/analytics';

// ── Lazy-loaded Page modules for optimal bundle splitting ───────
const LandingPage            = lazy(() => import('./pages/LandingPage'));
const DashboardPage          = lazy(() => import('./pages/DashboardPage'));
const BuilderPage            = lazy(() => import('./pages/BuilderPage'));
const Checklist              = lazy(() => import('./pages/Checklist'));
const Budget                 = lazy(() => import('./pages/Budget'));
const Notes                  = lazy(() => import('./pages/Notes'));
const SharedTrip             = lazy(() => import('./pages/SharedTrip'));
const MyTripsPage            = lazy(() => import('./pages/MyTripsPage'));
const CreateTripPage         = lazy(() => import('./pages/CreateTripPage'));
const ItineraryViewPage      = lazy(() => import('./pages/ItineraryViewPage'));
const CitySearchPage         = lazy(() => import('./pages/CitySearchPage'));
const ActivitySearchPage     = lazy(() => import('./pages/ActivitySearchPage'));
const ProfilePage            = lazy(() => import('./pages/ProfilePage'));
const AdminPage              = lazy(() => import('./pages/AdminPage'));
const CommunityPage          = lazy(() => import('./pages/CommunityPage'));
const PrivacyPolicyPage      = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage'));

import Footer                 from './components/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary }      from './components/ErrorBoundary';

const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-400 gap-3">
    <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
    <span className="text-xs font-medium text-slate-500">Loading module...</span>
  </div>
);


// ──────────────────────────────────────────────────────────────
// Auth guards
// ──────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-slate-900 max-w-md w-full p-8 rounded-lg border border-red-500/30 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <Shield size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            You are signed in as <strong className="text-white">{user?.email}</strong> with role <span className="text-amber-400 font-bold">"{user?.role || 'user'}"</span>. Only accounts with the <strong className="text-amber-400">admin</strong> role can access this portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Lock size={13} /> Switch to Admin Account
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

const UserOnlyRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

// ──────────────────────────────────────────────────────────────
// Login Page
// ──────────────────────────────────────────────────────────────
function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail]           = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmNewPw, setConfirmNewPw]       = useState('');
  const [resetLoading, setResetLoading]       = useState(false);
  const [resetMsg, setResetMsg]               = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const loggedUser = response.data.data?.user;
      if (response.data?.token) {
        login(response.data.token, loggedUser);
      }
      if (loggedUser?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || data?.errors?.[0] || 'Invalid credentials or server not reachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPw) {
      setResetMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setResetLoading(true);
    setResetMsg(null);
    try {
      const res = await api.post('/auth/forgot-password', {
        email: resetEmail,
        new_password: newPassword,
      });
      setResetMsg({ type: 'success', text: res.data?.message || 'Password reset successfully.' });
      setTimeout(() => {
        setShowForgotModal(false);
        setEmail(resetEmail);
        setPassword('');
      }, 1500);
    } catch (err) {
      setResetMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reset password.' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left Column: Architectural Photo with Functional Copy */}
      <div className="hidden lg:block w-[45%] relative border-r border-slate-800">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px]" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Plane size={16} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Traveloop</span>
          </Link>
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Multi-city itinerary builder and trip expense tracker.
            </h2>
            <p className="text-slate-300 text-sm max-w-sm leading-relaxed">
              Sign in to manage your multi-destination routes, schedule activities, organize packing lists, and monitor expenses.
            </p>
          </div>
          <div className="flex gap-4 text-xs text-slate-400 font-medium">
            <span>Route Builder</span>
            <span>•</span>
            <span>City Catalog</span>
            <span>•</span>
            <span>Budget Control</span>
          </div>
        </div>
      </div>

      {/* Right Column: Direct Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link to="/" className="flex items-center gap-2 lg:hidden mb-4">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <Plane size={15} />
            </div>
            <span className="text-lg font-bold text-white">Traveloop</span>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-white">Sign in to your account</h1>
            <p className="text-slate-400 text-xs mt-1">Enter your credentials to access your trips</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 text-red-300 border border-red-500/20 p-3 rounded-lg text-xs">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1.5">Email address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="admin@traveloop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 text-xs font-semibold">Password</label>
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(true); setResetEmail(email); }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight size={15} />
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs pt-2">
            Do not have an account?{' '}
            <Link to="/signup" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Create an account</Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-md w-full rounded-lg p-6 relative border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key size={16} className="text-blue-400" /> Reset Password
              </h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="text-slate-400 text-xs">Enter your registered email and a new password to restore access.</p>

            {resetMsg && (
              <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                resetMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-300 border border-red-500/20'
              }`}>
                {resetMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                <span>{resetMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Account Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">New Password (minimum 6 characters)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Repeat new password"
                  value={confirmNewPw}
                  onChange={e => setConfirmNewPw(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Signup Page
// ──────────────────────────────────────────────────────────────
function Signup() {
  const [firstName, setFirstName]             = useState('');
  const [lastName, setLastName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [phone, setPhone]                     = useState('');
  const [city, setCity]                       = useState('');
  const [country, setCountry]                 = useState('');
  const [bio, setBio]                         = useState('');
  const [avatarUrl, setAvatarUrl]             = useState('');
  const [avatarCompressing, setAvatarCompressing] = useState(false);
  const fileInputRef                          = useRef(null);
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarCompressing(true);
      const dataUrl = await compressImageFile(file, 256, 256, 0.8);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setError(err.message || 'Failed to process avatar image');
    } finally {
      setAvatarCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        password,
      };

      const response = await api.post('/auth/register', payload);
      const registeredUser = response.data.data?.user;
      if (response.data?.token) {
        login(response.data.token, registeredUser);
      }
      if (registeredUser?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.message) setError(data.message);
      else if (data?.errors?.length) setError(data.errors[0]);
      else setError('Registration failed or server not reachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left Column: Architectural Photo with Functional Copy */}
      <div className="hidden lg:block w-[40%] relative border-r border-slate-800">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px]" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Plane size={16} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Traveloop</span>
          </Link>
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Construct multi-city itineraries and manage trip finances.
            </h2>
            <p className="text-slate-300 text-sm max-w-sm leading-relaxed">
              Create an account to build customized travel schedules, track category budgets, and explore curated city activities.
            </p>
          </div>
          <div className="flex gap-4 text-xs text-slate-400 font-medium">
            <span>Itinerary Builder</span>
            <span>•</span>
            <span>Checklists</span>
            <span>•</span>
            <span>Community</span>
          </div>
        </div>
      </div>

      {/* Right Column: Clean Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 py-10 overflow-y-auto">
        <div className="w-full max-w-xl space-y-5">
          <Link to="/" className="flex items-center gap-2 lg:hidden mb-4">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <Plane size={15} />
            </div>
            <span className="text-lg font-bold text-white">Traveloop</span>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-slate-400 text-xs mt-1">Complete the details below to start planning itineraries</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 text-red-300 border border-red-500/20 p-3 rounded-lg text-xs">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Circular Avatar Local Picker */}
            <div className="flex flex-col items-center gap-2 pb-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full overflow-hidden border border-slate-700 bg-slate-900 group cursor-pointer"
                title="Select photo from computer"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-white transition-colors">
                    {firstName ? (
                      <span className="text-xl font-bold text-white">{firstName.charAt(0).toUpperCase()}</span>
                    ) : (
                      <UserIcon size={24} />
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-semibold transition-opacity">
                  {avatarUrl ? 'Change' : 'Upload'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarCompressing}
                  className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                >
                  {avatarCompressing ? 'Processing...' : (avatarUrl ? 'Change Photo' : 'Upload Photo (Optional)')}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/20 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* 2-Column Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morgan"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="alex@traveloop.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* City and Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Home City</label>
                <input
                  type="text"
                  placeholder="e.g. Seattle"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Country</label>
                <input
                  type="text"
                  placeholder="e.g. United States"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Password * (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Travel Profile Bio</label>
              <textarea
                rows={2}
                placeholder="Brief summary of travel preferences and primary interests..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight size={15} />
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs pt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// App Content Wrapper (Clean Navbar & Layout)
// ──────────────────────────────────────────────────────────────
const ROUTE_TITLES = {
  '/': 'Traveloop | Multi-City Itinerary & Budget Planner',
  '/dashboard': 'Dashboard | Traveloop',
  '/trips': 'My Trips | Traveloop',
  '/trips/new': 'Plan New Trip | Traveloop',
  '/community': 'Travel Community | Traveloop',
  '/cities': 'Explore Cities | Traveloop',
  '/activities': 'Explore Activities | Traveloop',
  '/checklist': 'Packing Checklist | Traveloop',
  '/budget': 'Budget & Expense Tracker | Traveloop',
  '/notes': 'Travel Journal & Notes | Traveloop',
  '/profile': 'Profile & Preferences | Traveloop',
  '/admin': 'Admin Control Portal | Traveloop',
  '/privacy': 'Privacy Policy | Traveloop',
  '/terms': 'Terms & Conditions | Traveloop',
  '/login': 'Sign In | Traveloop',
  '/signup': 'Create Account | Traveloop',
};

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuth = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/';
  const path = location.pathname;

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    trackPageView(location.pathname);

    // Dynamic document title
    const currentTitle = ROUTE_TITLES[location.pathname] || (
      location.pathname.startsWith('/trips/') ? 'Itinerary Details | Traveloop' :
      location.pathname.startsWith('/builder/') ? 'Trip Builder | Traveloop' :
      location.pathname.startsWith('/public/') ? 'Shared Itinerary | Traveloop' :
      'Traveloop | Multi-City Itinerary & Budget Planner'
    );
    document.title = currentTitle;
  }, [location.pathname]);

  const navLinkClass = (targetPath) =>
    `flex items-center gap-1.5 font-medium transition-colors px-2.5 py-1.5 rounded-lg text-xs md:text-sm ${
      path.startsWith(targetPath)
        ? 'text-white bg-slate-800 border border-slate-700'
        : 'text-slate-300 hover:text-white hover:bg-slate-850'
    }`;

  const mobileNavLinkClass = (targetPath) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      path.startsWith(targetPath)
        ? 'text-white bg-slate-800 border border-slate-700'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {!isAuth && (
        <>
          <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md h-16">
            <Link
              to={user?.role === 'admin' ? '/admin' : '/dashboard'}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Plane size={16} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Traveloop</span>
                {user?.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
            </Link>

            {/* Center Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-4xl">
              {user?.role === 'admin' ? (
                <>
                  <Link to="/admin" className={navLinkClass('/admin')}>
                    <BarChart3 size={14} /> Analytics Overview
                  </Link>
                  <a href="/admin#users" className={navLinkClass('/admin#users')}>
                    <Users size={14} /> User Management
                  </a>
                  <Link to="/cities" className={navLinkClass('/cities')}>
                    <Compass size={14} /> Cities Catalog
                  </Link>
                  <Link to="/activities" className={navLinkClass('/activities')}>
                    <Activity size={14} /> Activities Catalog
                  </Link>
                  <Link to="/community" className={navLinkClass('/community')}>
                    <Shield size={14} /> Community Moderation
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                    <Home size={14} /> Home
                  </Link>
                  <Link to="/trips" className={navLinkClass('/trips')}>
                    <Map size={14} /> My Trips
                  </Link>
                  <Link to="/community" className={navLinkClass('/community')}>
                    <Globe size={14} /> Community
                  </Link>
                  <Link to="/cities" className={navLinkClass('/cities')}>
                    <Compass size={14} /> Cities
                  </Link>
                  <Link to="/activities" className={navLinkClass('/activities')}>
                    <Activity size={14} /> Activities
                  </Link>
                  <Link to="/checklist" className={navLinkClass('/checklist')}>
                    <CheckSquare size={14} /> Checklist
                  </Link>
                  <Link to="/budget" className={navLinkClass('/budget')}>
                    <DollarSign size={14} /> Budget
                  </Link>
                  <Link to="/notes" className={navLinkClass('/notes')}>
                    <BookOpen size={14} /> Journal
                  </Link>
                </>
              )}
            </div>

            {/* Right Profile & Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium text-xs md:text-sm transition-colors ${
                  path === '/profile'
                    ? 'text-white bg-slate-800 border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-850'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline">{user?.name?.split(' ')[0] || 'Profile'}</span>
              </Link>

              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-slate-300 hover:text-white bg-slate-850 hover:bg-red-950/40 hover:text-red-400 border border-slate-800 transition-colors cursor-pointer"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>

              {/* Mobile Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(prev => !prev)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </nav>

          {/* Mobile Collapsible Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-slate-950/98 backdrop-blur-xl border-b border-slate-800 p-4 space-y-1 shadow-2xl">
              {user?.role === 'admin' ? (
                <>
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/admin')}>
                    <BarChart3 size={16} /> Analytics Overview
                  </Link>
                  <a href="/admin#users" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/admin#users')}>
                    <Users size={16} /> User Management
                  </a>
                  <Link to="/cities" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/cities')}>
                    <Compass size={16} /> Cities Catalog
                  </Link>
                  <Link to="/activities" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/activities')}>
                    <Activity size={16} /> Activities Catalog
                  </Link>
                  <Link to="/community" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/community')}>
                    <Shield size={16} /> Community Moderation
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/dashboard')}>
                    <Home size={16} /> Home Dashboard
                  </Link>
                  <Link to="/trips" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/trips')}>
                    <Map size={16} /> My Trips
                  </Link>
                  <Link to="/community" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/community')}>
                    <Globe size={16} /> Community
                  </Link>
                  <Link to="/cities" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/cities')}>
                    <Compass size={16} /> Cities Catalog
                  </Link>
                  <Link to="/activities" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/activities')}>
                    <Activity size={16} /> Activities Catalog
                  </Link>
                  <Link to="/checklist" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/checklist')}>
                    <CheckSquare size={16} /> Packing Checklist
                  </Link>
                  <Link to="/budget" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/budget')}>
                    <DollarSign size={16} /> Budget Tracker
                  </Link>
                  <Link to="/notes" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/notes')}>
                    <BookOpen size={16} /> Travel Journal
                  </Link>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/profile')}>
                    <UserIcon size={16} /> Profile & Settings
                  </Link>
                </>
              )}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-950/20 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1" style={!isAuth ? { paddingTop: '80px', paddingBottom: '30px' } : {}}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/"               element={<LandingPage />} />
              <Route path="/login"          element={<Login />} />
              <Route path="/signup"         element={<Signup />} />
              <Route path="/public/:tripId" element={<SharedTrip />} />
              <Route path="/community"      element={<CommunityPage />} />
              <Route path="/privacy"        element={<PrivacyPolicyPage />} />
              <Route path="/terms"          element={<TermsAndConditionsPage />} />

              {/* Traveler routes (Admins redirect to /admin) */}
              <Route path="/dashboard"            element={<UserOnlyRoute><DashboardPage /></UserOnlyRoute>} />
              <Route path="/trips"                element={<UserOnlyRoute><MyTripsPage /></UserOnlyRoute>} />
              <Route path="/trips/new"            element={<UserOnlyRoute><CreateTripPage /></UserOnlyRoute>} />
              <Route path="/trips/:tripId/view"   element={<UserOnlyRoute><ItineraryViewPage /></UserOnlyRoute>} />
              <Route path="/builder/:tripId"      element={<UserOnlyRoute><BuilderPage /></UserOnlyRoute>} />
              <Route path="/checklist"            element={<UserOnlyRoute><Checklist /></UserOnlyRoute>} />
              <Route path="/budget"               element={<UserOnlyRoute><Budget /></UserOnlyRoute>} />
              <Route path="/notes"                element={<UserOnlyRoute><Notes /></UserOnlyRoute>} />

              {/* Catalog & Administration */}
              <Route path="/cities"               element={<ProtectedRoute><CitySearchPage /></ProtectedRoute>} />
              <Route path="/activities"           element={<ProtectedRoute><ActivitySearchPage /></ProtectedRoute>} />
              <Route path="/profile"              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/admin"                element={<AdminRoute><AdminPage /></AdminRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Global Minimal Production Footer */}
      <Footer />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Root Application
// ──────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
