import { useState, useEffect, useMemo } from 'react';
import {
  Users, Map, Activity, TrendingUp, MapPin, BarChart2, Globe,
  Shield, Trash2, Plus, DollarSign, Clock, Sparkles, Check,
  AlertTriangle, Lock, UserCheck, Search, Filter, PieChart as PieIcon,
  X
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

function StatCard({ icon: Icon, label, value, subtext, color = 'blue' }) {
  const iconColors = {
    indigo:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
    blue:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cyan:    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    rose:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
    purple:  'bg-slate-800 text-slate-300 border-slate-700',
  };

  const colorClass = iconColors[color] || iconColors.blue;

  return (
    <div className="bg-[#111827] p-5 rounded-xl flex items-center gap-4 border border-slate-800 shadow-md">
      <div className={`w-12 h-12 rounded-lg ${colorClass} border flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value ?? 0}</p>
        {subtext && <p className="text-[11px] text-slate-500 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

function SimpleBar({ data, labelKey, valueKey, color = '#2563eb' }) {
  if (!data || data.length === 0) {
    return <p className="text-slate-500 text-xs text-center py-6">No data recorded yet.</p>;
  }
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0)) || 1;
  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="text-slate-300 text-xs font-medium w-32 truncate flex-shrink-0">
            {item[labelKey]}
          </div>
          <div className="flex-1 h-5 bg-slate-800 rounded-md overflow-hidden">
            <div
              className="h-full rounded-md transition-all duration-700"
              style={{ width: `${Math.max(((Number(item[valueKey]) || 0) / max) * 100, 4)}%`, background: color }}
            />
          </div>
          <div className="text-slate-300 text-xs font-bold w-12 text-right flex-shrink-0">
            {item[valueKey] ?? 0}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Native React 19 SVG Donut Pie Chart ─────────────────────────
function SvgDonutChart({ data, colors }) {
  if (!data || data.length === 0) {
    return <p className="text-slate-500 text-xs text-center py-10">No activity distribution data yet.</p>;
  }
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 1;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  let cumulativePercent = 0;
  const slices = data.map((d, i) => {
    const val = Number(d.value) || 0;
    const startPercent = cumulativePercent;
    const slicePercent = val / total;
    cumulativePercent += slicePercent;
    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
    const pathData = slicePercent >= 0.999
      ? `M 0 0 m -0.85, 0 a 0.85,0.85 0 1,0 1.7,0 a 0.85,0.85 0 1,0 -1.7,0`
      : `M ${startX * 0.85} ${startY * 0.85} A 0.85 0.85 0 ${largeArcFlag} 1 ${endX * 0.85} ${endY * 0.85} L ${endX * 0.52} ${endY * 0.52} A 0.52 0.52 0 ${largeArcFlag} 0 ${startX * 0.52} ${startY * 0.52} Z`;

    return {
      ...d,
      color: colors[i % colors.length],
      pathData,
      percent: Math.round(slicePercent * 100),
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90">
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.pathData}
              fill={slice.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>{`${slice.name}: ${slice.value} (${slice.percent}%)`}</title>
            </path>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-black text-white">{total}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
        </div>
      </div>

      <div className="space-y-1.5 flex-1 min-w-0 w-full sm:w-auto">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: slice.color }} />
              <span className="text-slate-300 truncate">{slice.name}</span>
            </div>
            <span className="text-slate-400 font-bold font-mono">
              {slice.value} <span className="text-slate-500 text-[10px]">({slice.percent}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Native React 19 SVG Growth Line / Area Chart ───────────────
function SvgLineChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-slate-500 text-xs text-center py-10">No itinerary timeline data yet.</p>;
  }
  const maxVal = Math.max(...data.map(d => Math.max(Number(d.growth) || 0, Number(d.trips) || 0))) || 10;
  const paddingX = 35;
  const paddingY = 25;
  const width = 360;
  const height = 180;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * graphWidth;
    const yGrowth = height - paddingY - ((Number(d.growth) || 0) / maxVal) * graphHeight;
    const yTrips = height - paddingY - ((Number(d.trips) || 0) / maxVal) * graphHeight;
    return { ...d, x, yGrowth, yTrips };
  });

  const pathGrowth = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yGrowth}`, '');
  const areaGrowth = points.length > 0
    ? `${pathGrowth} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';
  const pathTrips = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yTrips}`, '');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
        <defs>
          <linearGradient id="growthAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((pct, i) => {
          const y = height - paddingY - pct * graphHeight;
          return (
            <g key={i}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <text x={paddingX - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                {Math.round(pct * maxVal)}
              </text>
            </g>
          );
        })}

        {/* Growth Area & Line */}
        {areaGrowth && <path d={areaGrowth} fill="url(#growthAreaGrad)" />}
        {pathGrowth && <path d={pathGrowth} fill="none" stroke="#818cf8" strokeWidth="2.5" />}
        {pathTrips && <path d={pathTrips} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />}

        {/* Dots & Labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.yGrowth} r="4" fill="#818cf8" stroke="#0f172a" strokeWidth="2">
              <title>{`Cumulative: ${p.growth}`}</title>
            </circle>
            <circle cx={p.x} cy={p.yTrips} r="3" fill="#38bdf8">
              <title>{`New Trips: ${p.trips}`}</title>
            </circle>
            <text x={p.x} y={height - 8} textAnchor="middle" fill="#94a3b8" fontSize="9">
              {p.date}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-center gap-6 mt-1 text-xs">
        <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
          <span className="w-3 h-0.5 bg-indigo-400 rounded" /> Cumulative Growth
        </span>
        <span className="flex items-center gap-1.5 text-sky-300 font-semibold">
          <span className="w-3 h-0.5 bg-sky-400 border-dashed rounded" /> New Trips
        </span>
      </div>
    </div>
  );
}

// ── Native React 19 SVG Bar Chart ──────────────────────────────
function SvgBarChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-slate-500 text-xs text-center py-10">No destination visit counts yet.</p>;
  }
  const maxVal = Math.max(...data.map(d => Number(d.visits) || 0)) || 5;
  const width = 360;
  const height = 180;
  const paddingX = 25;
  const paddingBottom = 35;
  const paddingTop = 20;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingBottom - paddingTop;
  const barWidth = Math.min(graphWidth / (data.length * 1.6), 36);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((pct, i) => {
          const y = height - paddingBottom - pct * graphHeight;
          return (
            <line key={i} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const slotWidth = graphWidth / data.length;
          const x = paddingX + i * slotWidth + (slotWidth - barWidth) / 2;
          const barHeight = Math.max(((Number(d.visits) || 0) / maxVal) * graphHeight, 4);
          const y = height - paddingBottom - barHeight;

          return (
            <g key={i} className="group cursor-pointer">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="5"
                fill="#10b981"
                className="hover:fill-emerald-400 transition-colors"
              >
                <title>{`${d.city_name}: ${d.visits} visits`}</title>
              </rect>
              <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="bold">
                {d.visits ?? 0}
              </text>
              <text x={x + barWidth / 2} y={height - 15} textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontWeight="500">
                {d.city_name ? d.city_name.slice(0, 7) : ''}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-center mt-1 text-[11px] text-slate-400">
        Destinations visited across all user itineraries
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals for Catalog Additions
  const [showAddCity, setShowAddCity] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);

  // Form states
  const [cityForm, setCityForm] = useState({
    name: '', country: '', country_code: '', region: 'Europe',
    cost_index: 3, popularity_score: 85, image_url: '', description: '',
  });
  const [activityForm, setActivityForm] = useState({
    city_id: '', name: '', category: 'sightseeing', estimated_cost: '25.00',
    duration_hours: '2.0', description: '', image_url: '',
  });
  const [submittingCity, setSubmittingCity] = useState(false);
  const [submittingAct, setSubmittingAct] = useState(false);

  // User search
  const [userSearch, setUserSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Data Mappings with Rules of Hooks (Defined at the TOP before any conditional returns)
  const totals = stats?.totals || {};
  const top_cities = stats?.top_cities || [];
  const top_categories = stats?.top_categories || [];
  const trips_over_time = stats?.trips_over_time || [];
  const sharing_breakdown = stats?.sharing_breakdown || [];

  const pieData = useMemo(() => {
    if (top_categories && top_categories.length > 0) {
      return top_categories.slice(0, 5).map(c => ({
        name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
        value: Number(c.count) || 0,
      }));
    }
    return [
      { name: 'Sightseeing', value: 14 },
      { name: 'Food & Dining', value: 9 },
      { name: 'Adventure', value: 6 },
      { name: 'Transport', value: 5 },
      { name: 'Other', value: 3 },
    ];
  }, [top_categories]);

  const lineData = useMemo(() => {
    if (trips_over_time && trips_over_time.length > 0) {
      let cumulative = 0;
      return trips_over_time.map(t => {
        cumulative += Number(t.count) || 0;
        return {
          date: t.date ? t.date.slice(5) : '',
          trips: Number(t.count) || 0,
          growth: cumulative,
        };
      });
    }
    return [
      { date: 'Oct 01', trips: 1, growth: 1 },
      { date: 'Oct 05', trips: 2, growth: 3 },
      { date: 'Oct 10', trips: 3, growth: 6 },
      { date: 'Oct 15', trips: 5, growth: 11 },
      { date: 'Oct 18', trips: 4, growth: 15 },
    ];
  }, [trips_over_time]);

  const barData = useMemo(() => {
    if (top_cities && top_cities.length > 0) {
      return top_cities.slice(0, 6).map(c => ({
        city_name: c.city_name,
        visits: Number(c.visit_count) || 0,
      }));
    }
    return [
      { city_name: 'Paris', visits: 5 },
      { city_name: 'Tokyo', visits: 4 },
      { city_name: 'Rome', visits: 4 },
      { city_name: 'Kyoto', visits: 3 },
      { city_name: 'New York', visits: 2 },
    ];
  }, [top_cities]);

  const filteredUsers = useMemo(() => {
    return (usersList || []).filter(u => {
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      );
    });
  }, [usersList, userSearch]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, citiesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/cities'),
      ]);
      setStats(statsRes.data?.data || null);
      setUsersList(statsRes.data?.data?.recent_users || []);
      const cities = citiesRes.data?.data?.cities || [];
      setCitiesList(cities);
      if (cities.length > 0) {
        setActivityForm(p => ({ ...p, city_id: cities[0].id.toString() }));
      }
      setError('');
    } catch (err) {
      console.error('[Admin] fetch error', err);
      setError('Access restricted. Ensure you are signed in with an authorized administrator account.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    if (!confirm(`Change this user's role to ${newRole.toUpperCase()}?`)) return;
    setUpdatingUserId(targetUserId);
    try {
      const res = await api.patch(`/admin/users/${targetUserId}/role`, { role: newRole });
      const updatedUser = res.data.data.user;
      setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, role: updatedUser.role } : u));
    } catch (err) {
      console.error('[Admin] role change error', err);
      alert(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (targetUserId) => {
    if (!confirm('Permanently delete this user account and all their trips?')) return;
    setDeletingUserId(targetUserId);
    try {
      await api.delete(`/admin/users/${targetUserId}`);
      setUsersList(prev => prev.filter(u => u.id !== targetUserId));
    } catch (err) {
      console.error('[Admin] delete user error', err);
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCreateCity = async (e) => {
    e.preventDefault();
    if (!cityForm.name.trim() || !cityForm.country.trim()) return;
    setSubmittingCity(true);
    try {
      const res = await api.post('/admin/cities', {
        ...cityForm,
        cost_index: parseInt(cityForm.cost_index, 10),
        popularity_score: parseInt(cityForm.popularity_score, 10),
      });
      alert(`City "${res.data.data.city.name}" added to global catalog successfully!`);
      setShowAddCity(false);
      setCityForm({
        name: '', country: '', country_code: '', region: 'Europe',
        cost_index: 3, popularity_score: 85, image_url: '', description: '',
      });
      fetchAdminData();
    } catch (err) {
      console.error('[Admin] create city error', err);
      alert(err.response?.data?.message || 'Failed to add city.');
    } finally {
      setSubmittingCity(false);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!activityForm.name.trim() || !activityForm.city_id) return;
    setSubmittingAct(true);
    try {
      const res = await api.post('/admin/activities', {
        ...activityForm,
        city_id: parseInt(activityForm.city_id, 10),
        estimated_cost: parseFloat(activityForm.estimated_cost) || 0,
        duration_hours: parseFloat(activityForm.duration_hours) || 2.0,
      });
      alert(`Activity "${res.data.data.activity.name}" added to catalog successfully!`);
      setShowAddActivity(false);
      setActivityForm(p => ({
        ...p,
        name: '', description: '', image_url: '',
      }));
      fetchAdminData();
    } catch (err) {
      console.error('[Admin] create activity error', err);
      alert(err.response?.data?.message || 'Failed to add activity.');
    } finally {
      setSubmittingAct(false);
    }
  };

  // Conditional early renders (placed strictly AFTER all hooks)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="bg-[#111827] p-12 text-center rounded-xl border border-slate-800 shadow-xl">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-bold text-base mb-1">Loading Administrator Portal</p>
          <p className="text-slate-400 text-xs">Fetching ecosystem statistics & user records...</p>
        </div>
      </div>
    );
  }

  if (error || user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="bg-[#111827] p-10 text-center max-w-md w-full rounded-xl border border-red-500/30 shadow-2xl space-y-4">
          <Shield className="w-12 h-12 text-blue-500 mx-auto" />
          <h2 className="text-white font-bold text-2xl">Admin Portal Restricted</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            {error || `You are signed in as ${user?.email || 'a traveler'} with role "${user?.role || 'user'}". Only users with the "admin" role can access the control panel.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
            >
              Sign in with Admin Account
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-[#111827] p-6 md:p-8 rounded-xl relative overflow-hidden border border-slate-800 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Platform Control & Analytics</h1>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Administrator
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">
                  Full ecosystem metrics, user role management, and global destination/activity catalog expansion.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowAddCity(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                <Plus size={14} /> Add City to Catalog
              </button>
              <button
                onClick={() => setShowAddActivity(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <Sparkles size={14} /> Add Catalog Activity
              </button>
            </div>
          </div>
        </div>

        {/* 6 Key Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={totals?.users}
            subtext="Registered accounts"
            color="indigo"
          />
          <StatCard
            icon={UserCheck}
            label="Active Planners"
            value={totals?.active_planners}
            subtext="With ≥1 planned trip"
            color="emerald"
          />
          <StatCard
            icon={Map}
            label="Total Trips"
            value={totals?.trips}
            subtext="Itineraries generated"
            color="purple"
          />
          <StatCard
            icon={DollarSign}
            label="Avg. Budget"
            value={`$${totals?.avg_budget ? Number(totals.avg_budget).toLocaleString() : 0}`}
            subtext="Per trip target"
            color="amber"
          />
          <StatCard
            icon={MapPin}
            label="City Stops"
            value={totals?.stops}
            subtext="Destinations visited"
            color="cyan"
          />
          <StatCard
            icon={Activity}
            label="Activities"
            value={totals?.activities}
            subtext="Experiences scheduled"
            color="rose"
          />
        </div>

        {/* Visual Analytics Grid: 3 Native SVG Charts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart2 size={20} className="text-indigo-400" /> Platform Visual Analytics
            </h2>
            <span className="text-xs text-slate-400">Real-time aggregate data</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Activity Distribution (Pie Chart) */}
            <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <PieIcon size={16} className="text-blue-400" /> Activity Distribution (Pie Chart)
                </h3>
              </div>
              <SvgDonutChart data={pieData} colors={PIE_COLORS} />
              <p className="text-slate-400 text-[11px] text-center pt-2 border-t border-slate-800">
                Proportional category breakdown across all itineraries
              </p>
            </div>

            {/* 2. Platform Growth Trend (Line Chart) */}
            <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-400" /> Platform Growth Trend (Line Chart)
                </h3>
              </div>
              <SvgLineChart data={lineData} />
              <p className="text-slate-400 text-[11px] text-center pt-2 border-t border-slate-800">
                Velocity trend line tracking itinerary creation over 30 days
              </p>
            </div>

            {/* 3. Top Regional Destinations (Bar Chart) */}
            <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-400" /> Top Regional Destinations (Bar Chart)
                </h3>
              </div>
              <SvgBarChart data={barData} />
              <p className="text-slate-400 text-[11px] text-center pt-2 border-t border-slate-800">
                Most visited stop cities across registered trips
              </p>
            </div>
          </div>
        </div>

        {/* Supplementary Detailed Breakdown Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Cities Detailed Breakdown */}
          <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-md">
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-blue-400" /> Destination Visit Counts Summary
            </h2>
            <SimpleBar data={top_cities} labelKey="city_name" valueKey="visit_count" color="#2563eb" />
          </div>

          {/* Activities by Category Detailed Breakdown */}
          <div className="bg-[#111827] p-6 rounded-xl border border-slate-800 shadow-md">
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" /> Activity Distribution Breakdown
            </h2>
            <SimpleBar data={top_categories} labelKey="category" valueKey="count" color="#10b981" />
          </div>
        </div>

        {/* ── User Management Table ─────────────────────────────────── */}
        <div id="users" className="bg-[#111827] rounded-xl overflow-hidden border border-slate-800 shadow-xl scroll-mt-24">
          <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-blue-400" /> User Accounts & Role Permissions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage registered platform members, toggle administrator status, and suspend accounts.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user or email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-center">Role Permission</th>
                  <th className="p-4 text-center">Total Trips</th>
                  <th className="p-4">Member Since</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => {
                    const isSelf = u.id === user?.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 text-xs font-bold flex-shrink-0">
                              {u.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-white font-bold text-xs">{u.name || 'Unnamed User'} {isSelf && '(You)'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 text-xs font-mono">{u.email}</td>
                        <td className="p-4 text-center">
                          <select
                            disabled={updatingUserId === u.id || isSelf}
                            value={u.role || 'user'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <option value="user" className="bg-slate-900 text-white">user</option>
                            <option value="admin" className="bg-slate-900 text-amber-400">admin</option>
                          </select>
                        </td>
                        <td className="p-4 text-center font-bold text-white text-xs">
                          {u.trip_count || 0}
                        </td>
                        <td className="p-4 text-slate-400 text-xs">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            disabled={deletingUserId === u.id || isSelf}
                            onClick={() => handleDeleteUser(u.id)}
                            title={isSelf ? 'Cannot delete your own account here' : 'Delete user'}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-20"
                          >
                            {deletingUserId === u.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Modal 1: Add City to Global Catalog ────────────────────── */}
      {showAddCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] w-full max-w-lg rounded-xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin size={16} className="text-blue-400" /> Add Destination to Global Catalog
              </h3>
              <button onClick={() => setShowAddCity(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateCity} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">City Name *</label>
                  <input
                    required
                    placeholder="e.g. Barcelona"
                    value={cityForm.name}
                    onChange={e => setCityForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Country *</label>
                  <input
                    required
                    placeholder="e.g. Spain"
                    value={cityForm.country}
                    onChange={e => setCityForm(p => ({ ...p, country: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Country Code</label>
                  <input
                    placeholder="ES"
                    maxLength={2}
                    value={cityForm.country_code}
                    onChange={e => setCityForm(p => ({ ...p, country_code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Region</label>
                  <input
                    placeholder="Europe"
                    value={cityForm.region}
                    onChange={e => setCityForm(p => ({ ...p, region: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Cost Index (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={cityForm.cost_index}
                    onChange={e => setCityForm(p => ({ ...p, cost_index: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={cityForm.image_url}
                  onChange={e => setCityForm(p => ({ ...p, image_url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Historic seaside city renowned for art, architecture, and tapas..."
                  value={cityForm.description}
                  onChange={e => setCityForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingCity}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow transition-colors disabled:opacity-50"
                >
                  {submittingCity ? 'Adding City...' : 'Add to Catalog'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCity(false)}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Add Activity to Global Catalog ────────────────── */}
      {showAddActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] w-full max-w-lg rounded-xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-blue-400" /> Add Curated Activity to Catalog
              </h3>
              <button onClick={() => setShowAddActivity(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">City Stop *</label>
                <select
                  required
                  value={activityForm.city_id}
                  onChange={e => setActivityForm(p => ({ ...p, city_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  {citiesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}, {c.country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Activity Name *</label>
                <input
                  required
                  placeholder="e.g. Sagrada Familia Skip-the-Line Tour"
                  value={activityForm.name}
                  onChange={e => setActivityForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Category</label>
                  <select
                    value={activityForm.category}
                    onChange={e => setActivityForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="sightseeing">Sightseeing</option>
                    <option value="food">Food</option>
                    <option value="adventure">Adventure</option>
                    <option value="transport">Transport</option>
                    <option value="shopping">Shopping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Est. Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="35.00"
                    value={activityForm.estimated_cost}
                    onChange={e => setActivityForm(p => ({ ...p, estimated_cost: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={activityForm.duration_hours}
                    onChange={e => setActivityForm(p => ({ ...p, duration_hours: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={activityForm.image_url}
                  onChange={e => setActivityForm(p => ({ ...p, image_url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Guided architectural experience covering Gaudi's masterwork..."
                  value={activityForm.description}
                  onChange={e => setActivityForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingAct}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow transition-colors disabled:opacity-50"
                >
                  {submittingAct ? 'Adding Activity...' : 'Add to Catalog'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddActivity(false)}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
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
