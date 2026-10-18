import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Calendar, Trash2, Eye, Edit3, Globe, Lock,
  Search, ArrowUpDown, AlertTriangle, Layers, Filter, CheckCircle2,
  Clock, CheckSquare, Compass, Check
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539627831859-a911cf04d3cd?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
];

function formatDate(d) {
  if (!d) return 'Dates TBD';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MyTripsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Control Bar States
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('status'); // 'status', 'none'
  const [filter, setFilter] = useState('all'); // 'all', 'ongoing', 'upcoming', 'completed', 'public', 'private'
  const [sortBy, setSortBy] = useState('start_date_asc');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trips');
      setTrips(res.data.data?.trips || []);
    } catch (err) {
      console.error('[MyTrips] fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tripId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this trip? This will delete all associated stops, activities, and expenses.')) return;
    setDeletingId(tripId);
    try {
      await api.delete(`/trips/${tripId}`);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) {
      console.error('[MyTrips] delete error', err);
    } finally {
      setDeletingId(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getTripStatus = (t) => {
    if (!t.start_date) return 'upcoming';
    if (t.start_date <= todayStr && t.end_date && t.end_date >= todayStr) return 'ongoing';
    if (t.end_date && t.end_date < todayStr) return 'completed';
    if (t.start_date > todayStr) return 'upcoming';
    return 'upcoming';
  };

  const processedTrips = useMemo(() => {
    let result = [...trips];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (filter === 'ongoing') {
      result = result.filter((t) => getTripStatus(t) === 'ongoing');
    } else if (filter === 'upcoming') {
      result = result.filter((t) => getTripStatus(t) === 'upcoming');
    } else if (filter === 'completed') {
      result = result.filter((t) => getTripStatus(t) === 'completed');
    } else if (filter === 'public') {
      result = result.filter((t) => t.sharing_status === 'public');
    } else if (filter === 'private') {
      result = result.filter((t) => t.sharing_status === 'private');
    }

    result.sort((a, b) => {
      if (sortBy === 'start_date_asc') {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date) - new Date(b.start_date);
      }
      if (sortBy === 'start_date_desc') {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(b.start_date) - new Date(a.start_date);
      }
      if (sortBy === 'budget_high') {
        return (parseFloat(b.total_budget) || 0) - (parseFloat(a.total_budget) || 0);
      }
      if (sortBy === 'budget_low') {
        return (parseFloat(a.total_budget) || 0) - (parseFloat(b.total_budget) || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return result;
  }, [trips, search, filter, sortBy, todayStr]);

  const ongoingTrips = useMemo(
    () => processedTrips.filter((t) => getTripStatus(t) === 'ongoing'),
    [processedTrips]
  );
  const upcomingTrips = useMemo(
    () => processedTrips.filter((t) => getTripStatus(t) === 'upcoming'),
    [processedTrips]
  );
  const completedTrips = useMemo(
    () => processedTrips.filter((t) => getTripStatus(t) === 'completed'),
    [processedTrips]
  );

  const renderTripCard = (trip, idx) => {
    const cover = trip.cover_image_url || COVER_IMAGES[idx % COVER_IMAGES.length];
    const budget = parseFloat(trip.total_budget || 0);
    const spent = parseFloat(trip.total_spent || 0);
    const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
    const isOver = budget > 0 && spent > budget;
    const status = getTripStatus(trip);

    const statusPill = {
      ongoing: { text: 'Active Route', bg: 'bg-emerald-600/90 text-white' },
      upcoming: { text: 'Upcoming Departure', bg: 'bg-blue-600/90 text-white' },
      completed: { text: 'Concluded', bg: 'bg-slate-700/90 text-slate-200' },
    }[status];

    return (
      <div
        key={trip.id}
        onClick={() => navigate(`/builder/${trip.id}`)}
        className="group overflow-hidden rounded-lg border border-slate-800 bg-[#111827] hover:border-slate-700 transition-colors cursor-pointer flex flex-col justify-between"
      >
        {/* Cover image */}
        <div className="relative h-44 overflow-hidden bg-slate-900">
          <img
            src={cover}
            alt={trip.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => (e.target.src = COVER_IMAGES[0])}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${statusPill.bg}`}>
              {statusPill.text}
            </span>
          </div>

          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 border ${
                trip.sharing_status === 'public'
                  ? 'bg-emerald-600/80 text-white border-emerald-500/30'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700'
              }`}
            >
              {trip.sharing_status === 'public' ? <Globe size={10} /> : <Lock size={10} />}
              {trip.sharing_status === 'public' ? 'Public' : 'Private'}
            </span>
          </div>

          <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
            <span className="text-[11px] font-medium text-slate-200 bg-black/70 px-2 py-0.5 rounded">
              {trip.stop_count || 0} stop{trip.stop_count !== 1 ? 's' : ''}
            </span>
            {trip.currency && (
              <span className="text-xs font-mono font-bold text-amber-300 bg-black/70 px-2 py-0.5 rounded">
                {trip.currency}
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
          <div>
            <h3 className="text-white font-semibold text-sm leading-snug group-hover:text-blue-400 transition-colors line-clamp-1">
              {trip.title}
            </h3>
            {trip.description && (
              <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                {trip.description}
              </p>
            )}

            <div className="flex items-center gap-1.5 text-slate-300 text-xs mt-2.5">
              <Calendar size={13} className="text-slate-400 flex-shrink-0" />
              <span>
                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
              </span>
            </div>
          </div>

          {/* Budget progress */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-400">
                Spent: <strong className="text-slate-200 font-medium">${spent.toLocaleString()}</strong>
              </span>
              <span className="text-slate-400">
                Budget: <strong className="text-slate-200 font-medium">${budget.toLocaleString()}</strong>
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm transition-all duration-500 ${
                  isOver ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
            {isOver && (
              <span className="text-rose-400 text-[10px] font-semibold flex items-center gap-1 mt-0.5">
                <AlertTriangle size={10} /> Over allocated budget
              </span>
            )}
          </div>

          {/* Card Actions */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate(`/trips/${trip.id}/view`)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1f2937] text-slate-200 hover:bg-slate-700 text-xs font-medium border border-slate-700 transition-colors"
                title="View Itinerary"
              >
                <Eye size={12} /> View
              </button>
              <button
                onClick={() => navigate(`/builder/${trip.id}`)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 text-xs font-medium border border-blue-500/20 transition-colors"
                title="Open Itinerary Builder"
              >
                <Edit3 size={12} /> Builder
              </button>
            </div>

            <button
              onClick={(e) => handleDelete(trip.id, e)}
              disabled={deletingId === trip.id}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
              title="Delete Trip"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full px-4 md:px-8 pb-20 bg-[#0b0f17] text-slate-100">
      <div className="w-full max-w-7xl mx-auto space-y-6 pt-2">

        {/* Page Header */}
        <div className="p-6 md:p-8 rounded-xl border border-slate-800 bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <Layers size={13} />
              <span>Trip Portfolio & Records</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Trips</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              {trips.length === 0
                ? 'No itineraries planned yet. Create your first trip to begin.'
                : `Managing ${trips.length} itinerary records across active, upcoming, and archived states.`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setGroupBy((prev) => (prev === 'status' ? 'none' : 'status'))}
              className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-2 ${
                groupBy === 'status'
                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                  : 'bg-[#1f2937] border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers size={14} />
              {groupBy === 'status' ? 'Status View' : 'Grid View'}
            </button>

            <Link
              to="/trips/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <Plus size={16} /> Plan New Trip
            </Link>
          </div>
        </div>

        {/* Control Bar */}
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter trips by destination or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-xs text-slate-300">
              <Layers size={13} className="text-slate-400" />
              <span className="text-slate-400 text-xs">Group:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="status" className="bg-[#111827] text-white">Status</option>
                <option value="none" className="bg-[#111827] text-white">None (All Grid)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-xs text-slate-300">
              <Filter size={13} className="text-slate-400" />
              <span className="text-slate-400 text-xs">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#111827] text-white">All ({trips.length})</option>
                <option value="ongoing" className="bg-[#111827] text-white">Ongoing Only</option>
                <option value="upcoming" className="bg-[#111827] text-white">Upcoming Only</option>
                <option value="completed" className="bg-[#111827] text-white">Completed Only</option>
                <option value="public" className="bg-[#111827] text-white">Public Only</option>
                <option value="private" className="bg-[#111827] text-white">Private Only</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-xs text-slate-300">
              <ArrowUpDown size={13} className="text-slate-400" />
              <span className="text-slate-400 text-xs">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="start_date_asc" className="bg-[#111827] text-white">Start Date (Earliest)</option>
                <option value="start_date_desc" className="bg-[#111827] text-white">Start Date (Latest)</option>
                <option value="budget_high" className="bg-[#111827] text-white">Budget (High to Low)</option>
                <option value="budget_low" className="bg-[#111827] text-white">Budget (Low to High)</option>
                <option value="title" className="bg-[#111827] text-white">Title (A to Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && trips.length === 0 && (
          <div className="p-12 rounded-xl text-center border border-slate-800 bg-[#111827] space-y-3 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center mx-auto">
              <Compass size={24} />
            </div>
            <h2 className="text-lg font-bold text-white">No Trips Recorded Yet</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Create an itinerary to plan destination stops, schedule activities, and budget your expenses.
            </p>
            <Link
              to="/trips/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm"
            >
              <Plus size={16} /> Plan New Trip
            </Link>
          </div>
        )}

        {/* Status Grouping */}
        {!loading && trips.length > 0 && groupBy === 'status' && (
          <div className="space-y-8">
            {/* a) Ongoing Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Ongoing Trips
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                    {ongoingTrips.length}
                  </span>
                </div>
                <span className="text-xs text-slate-500">Live active schedules</span>
              </div>

              {ongoingTrips.length === 0 ? (
                <div className="p-4 rounded-lg text-center border border-slate-800 bg-[#111827] text-slate-400 text-xs">
                  No trips currently in progress today.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ongoingTrips.map((t, idx) => renderTripCard(t, idx))}
                </div>
              )}
            </div>

            {/* b) Upcoming Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-blue-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Upcoming Trips
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                    {upcomingTrips.length}
                  </span>
                </div>
                <span className="text-xs text-slate-500">Scheduled departures</span>
              </div>

              {upcomingTrips.length === 0 ? (
                <div className="p-4 rounded-lg text-center border border-slate-800 bg-[#111827] text-slate-400 text-xs">
                  No upcoming trips scheduled.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingTrips.map((t, idx) => renderTripCard(t, idx + 2))}
                </div>
              )}
            </div>

            {/* c) Completed Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckSquare size={15} className="text-slate-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Concluded Trips
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                    {completedTrips.length}
                  </span>
                </div>
                <span className="text-xs text-slate-500">Past itineraries</span>
              </div>

              {completedTrips.length === 0 ? (
                <div className="p-4 rounded-lg text-center border border-slate-800 bg-[#111827] text-slate-400 text-xs">
                  No completed trips recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedTrips.map((t, idx) => renderTripCard(t, idx + 4))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View 2: All Trips Grid */}
        {!loading && trips.length > 0 && groupBy === 'none' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                All Trips ({processedTrips.length})
              </h2>
            </div>
            {processedTrips.length === 0 ? (
              <div className="p-6 rounded-lg text-center text-slate-400 text-xs border border-slate-800 bg-[#111827]">
                No trips match your current filter and search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processedTrips.map((t, idx) => renderTripCard(t, idx))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
