import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, TrendingUp, Plus, Globe, ArrowRight,
  Compass, AlertTriangle, Search, Filter, Layers, ArrowUpDown, Star, Check
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function fmt(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=600&auto=format',
  'https://images.unsplash.com/photo-1539627831859-a911cf04d3cd?q=80&w=600&auto=format',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600&auto=format',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format',
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Control Bar States
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState('none'); // 'none', 'status', 'month'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'upcoming', 'completed', 'public'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'budget_high', 'budget_low', 'title'

  useEffect(() => {
    Promise.all([
      api.get('/trips'),
      api.get('/cities?sort=popular'),
    ])
      .then(([tripsRes, citiesRes]) => {
        setTrips(tripsRes.data.data?.trips || []);
        setDestinations(citiesRes.data.data?.cities || []);
      })
      .catch((err) => console.error('[Dashboard] fetch error', err))
      .finally(() => setLoading(false));
  }, []);

  const totalBudgetAcrossTrips = trips.reduce((s, t) => s + parseFloat(t.total_budget || 0), 0);
  const totalSpentAcrossTrips  = trips.reduce((s, t) => s + parseFloat(t.total_spent || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered and Sorted Trips
  const processedTrips = useMemo(() => {
    let result = [...trips];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (filterBy === 'upcoming') {
      result = result.filter((t) => t.start_date && t.start_date > todayStr);
    } else if (filterBy === 'completed') {
      result = result.filter((t) => t.end_date && t.end_date < todayStr);
    } else if (filterBy === 'ongoing') {
      result = result.filter(
        (t) => t.start_date && t.end_date && t.start_date <= todayStr && t.end_date >= todayStr
      );
    } else if (filterBy === 'public') {
      result = result.filter((t) => t.sharing_status === 'public');
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || b.start_date || 0) - new Date(a.created_at || a.start_date || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || a.start_date || 0) - new Date(b.created_at || b.start_date || 0);
      }
      if (sortBy === 'budget_high') {
        return parseFloat(b.total_budget || 0) - parseFloat(a.total_budget || 0);
      }
      if (sortBy === 'budget_low') {
        return parseFloat(a.total_budget || 0) - parseFloat(b.total_budget || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return result;
  }, [trips, searchQuery, filterBy, sortBy, todayStr]);

  // Grouped Trips
  const groupedTrips = useMemo(() => {
    if (groupBy === 'status') {
      const groups = { Ongoing: [], Upcoming: [], Completed: [], Undated: [] };
      processedTrips.forEach((t) => {
        if (!t.start_date) groups.Undated.push(t);
        else if (t.start_date <= todayStr && t.end_date && t.end_date >= todayStr) groups.Ongoing.push(t);
        else if (t.start_date > todayStr) groups.Upcoming.push(t);
        else groups.Completed.push(t);
      });
      return groups;
    }
    if (groupBy === 'month') {
      const groups = {};
      processedTrips.forEach((t) => {
        const monthKey = t.start_date
          ? new Date(t.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : 'Flexible / Undated';
        if (!groups[monthKey]) groups[monthKey] = [];
        groups[monthKey].push(t);
      });
      return groups;
    }
    return { 'All Trips': processedTrips };
  }, [processedTrips, groupBy, todayStr]);

  const previousTrips = trips.filter((t) => t.end_date && t.end_date < todayStr);
  const upcomingTrips = trips.filter((t) => !t.end_date || t.end_date >= todayStr);

  return (
    <div className="w-full px-4 md:px-8 pb-20 relative bg-[#0b0f17] text-slate-100">
      <div className="w-full max-w-7xl mx-auto space-y-6 pt-2">

        {/* 1. Header Banner Card */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#111827] min-h-[220px] md:min-h-[260px] flex items-end">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/80 to-transparent" />

          <div className="relative z-10 p-6 md:p-8 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Compass size={13} />
                <span>Travel Operations Dashboard</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Trip Operations & Route Management
              </h1>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                Welcome back, <strong className="text-slate-200">{user?.first_name || user?.name?.split(' ')[0] || 'Traveler'}</strong>. Track itinerary sequences, live expenditures, and regional destinations from this workspace.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                to="/cities"
                className="px-4 py-2.5 rounded-lg bg-[#1f2937] hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2"
              >
                <Compass size={15} /> Global Catalog
              </Link>
              <Link
                to="/trips/new"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                <Plus size={16} /> Create New Trip
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Control Bar */}
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter trips by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
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
                <option value="none" className="bg-[#111827] text-white">None</option>
                <option value="status" className="bg-[#111827] text-white">Status</option>
                <option value="month" className="bg-[#111827] text-white">Month</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-xs text-slate-300">
              <Filter size={13} className="text-slate-400" />
              <span className="text-slate-400 text-xs">Filter:</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#111827] text-white">All Trips</option>
                <option value="upcoming" className="bg-[#111827] text-white">Upcoming Only</option>
                <option value="ongoing" className="bg-[#111827] text-white">Ongoing Only</option>
                <option value="completed" className="bg-[#111827] text-white">Completed Only</option>
                <option value="public" className="bg-[#111827] text-white">Public Only</option>
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
                <option value="newest" className="bg-[#111827] text-white">Newest First</option>
                <option value="oldest" className="bg-[#111827] text-white">Oldest First</option>
                <option value="budget_high" className="bg-[#111827] text-white">Budget (High to Low)</option>
                <option value="budget_low" className="bg-[#111827] text-white">Budget (Low to High)</option>
                <option value="title" className="bg-[#111827] text-white">Title (A to Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Top Regional Selections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Compass className="text-blue-400" size={17} /> Featured Destinations
              </h2>
              <p className="text-slate-400 text-xs">
                Seeded regional destinations with live database cost index and popularity scoring
              </p>
            </div>
            <Link to="/cities" className="text-blue-400 text-xs font-semibold hover:text-blue-300 flex items-center gap-1 transition-colors">
              View catalog ({destinations.length}) <ArrowRight size={13} />
            </Link>
          </div>

          {destinations.length === 0 ? (
            <div className="p-8 rounded-lg text-center border border-slate-800 bg-[#111827]">
              <Compass className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-white text-sm font-semibold mb-1">No Destinations in Catalog</p>
              <p className="text-slate-400 text-xs mb-3">Add regional destinations to the catalog to begin planning.</p>
              <Link to="/cities" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
                <Plus size={13} /> Add City to Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {destinations.slice(0, 6).map((dest) => (
                <div
                  key={dest.id}
                  onClick={() => navigate(`/activities?city_id=${dest.id}`)}
                  className="group overflow-hidden rounded-lg border border-slate-800 bg-[#111827] hover:border-slate-700 transition-colors cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative h-28 overflow-hidden bg-slate-900">
                    <img
                      src={dest.image_url}
                      alt={dest.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 text-amber-300 text-[10px] font-semibold border border-white/10">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        {dest.popularity_score}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-white font-semibold text-xs truncate group-hover:text-blue-400 transition-colors">
                      {dest.name}
                    </h4>
                    <p className="text-slate-400 text-[11px] truncate">{dest.country}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                      <span className="text-emerald-400 font-mono text-xs font-semibold">{'$'.repeat(dest.cost_index || 3)}</span>
                      <span className="text-blue-400 text-[10px] font-medium flex items-center gap-0.5">
                        Explore <ArrowRight size={10} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Trip Highlights & Overview */}
        {groupBy !== 'none' ? (
          <div className="space-y-6">
            {Object.entries(groupedTrips).map(([groupTitle, groupItems]) => {
              if (groupItems.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{groupTitle}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                      {groupItems.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {groupItems.map((trip, idx) => {
                      const cover = trip.cover_image_url || COVER_IMAGES[idx % COVER_IMAGES.length];
                      return (
                        <div
                          key={trip.id}
                          onClick={() => navigate(`/builder/${trip.id}`)}
                          className="group overflow-hidden rounded-lg border border-slate-800 bg-[#111827] hover:border-slate-700 transition-colors cursor-pointer"
                        >
                          <div className="relative h-32 overflow-hidden bg-slate-900">
                            <img src={cover} alt={trip.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                            {trip.sharing_status === 'public' && (
                              <div className="absolute top-2.5 right-2.5">
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600/80 text-white text-[10px] font-semibold">
                                  <Globe size={10} /> Public
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-3.5">
                            <h4 className="text-white font-semibold text-sm truncate group-hover:text-blue-400 transition-colors">{trip.title}</h4>
                            <div className="flex items-center justify-between text-slate-400 text-xs mt-2">
                              <span className="flex items-center gap-1"><Calendar size={12} /> {trip.start_date ? fmt(trip.start_date) : 'Dates TBD'}</span>
                              <span className="text-slate-300 font-medium">{trip.stop_count || 0} stops</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming / Active Trips */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={16} className="text-blue-400" /> Active & Upcoming Trips
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                    {upcomingTrips.length}
                  </span>
                </div>
                <Link to="/trips" className="text-blue-400 text-xs font-semibold hover:text-blue-300 flex items-center gap-1 transition-colors">
                  View all in My Trips <ArrowRight size={13} />
                </Link>
              </div>

              {upcomingTrips.length === 0 ? (
                <div className="p-6 rounded-lg text-center border border-slate-800 bg-[#111827] space-y-2">
                  <p className="text-slate-400 text-xs">No active or upcoming trips scheduled.</p>
                  <Link
                    to="/trips/new"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                  >
                    <Plus size={14} /> Plan Itinerary
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingTrips.slice(0, 3).map((trip, idx) => {
                    const cover = trip.cover_image_url || COVER_IMAGES[idx % COVER_IMAGES.length];
                    return (
                      <div
                        key={trip.id}
                        onClick={() => navigate(`/builder/${trip.id}`)}
                        className="group overflow-hidden rounded-lg border border-slate-800 bg-[#111827] hover:border-slate-700 transition-colors cursor-pointer"
                      >
                        <div className="relative h-36 overflow-hidden bg-slate-900">
                          <img src={cover} alt={trip.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                          {trip.sharing_status === 'public' && (
                            <div className="absolute top-2.5 right-2.5">
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600/80 text-white text-[10px] font-semibold">
                                <Globe size={10} /> Public
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-3.5">
                          <h3 className="text-white font-semibold text-sm truncate group-hover:text-blue-400 transition-colors">{trip.title}</h3>
                          <div className="flex items-center justify-between text-slate-400 text-xs mt-2">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {trip.start_date ? fmt(trip.start_date) : 'Dates TBD'}</span>
                            <span className="text-slate-300 font-medium">{trip.stop_count || 0} stops</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Previous Trips Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers size={16} className="text-slate-400" /> Concluded Trips
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                    {previousTrips.length}
                  </span>
                </div>
                {previousTrips.length > 3 && (
                  <Link to="/trips" className="text-blue-400 text-xs font-semibold hover:text-blue-300 flex items-center gap-1 transition-colors">
                    View full archive <ArrowRight size={13} />
                  </Link>
                )}
              </div>

              {previousTrips.length === 0 ? (
                <div className="p-5 rounded-lg text-center border border-slate-800 bg-[#111827]">
                  <p className="text-slate-400 text-xs">
                    Trips whose end dates have passed will automatically be recorded here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {previousTrips.slice(0, 3).map((trip, idx) => {
                    const cover = trip.cover_image_url || COVER_IMAGES[(idx + 2) % COVER_IMAGES.length];
                    return (
                      <div
                        key={trip.id}
                        onClick={() => navigate(`/trips/${trip.id}/view`)}
                        className="group overflow-hidden rounded-lg border border-slate-800 bg-[#111827] hover:border-slate-700 transition-colors cursor-pointer"
                      >
                        <div className="relative h-32 overflow-hidden bg-slate-900">
                          <img src={cover} alt={trip.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                          <div className="absolute top-2.5 left-2.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">
                              <Check size={10} /> Completed
                            </span>
                          </div>
                        </div>
                        <div className="p-3.5">
                          <h4 className="text-white font-semibold text-sm truncate group-hover:text-blue-400 transition-colors">{trip.title}</h4>
                          <div className="flex items-center justify-between text-slate-400 text-xs mt-2">
                            <span>{fmt(trip.start_date)} - {fmt(trip.end_date)}</span>
                            <span className="text-slate-200 font-mono font-medium">${parseFloat(trip.total_spent || trip.total_budget || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Budget Status Highlights */}
        {trips.length > 0 && (
          <div className="p-5 md:p-6 rounded-xl border border-slate-800 bg-[#111827]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-400" /> Trip Budget Status
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">Live expenditures vs. allocated budgets from the database</p>
              </div>
              <Link to="/budget" className="text-blue-400 text-xs font-semibold hover:text-blue-300 flex items-center gap-1">
                Full Budget Sheet <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trips.slice(0, 3).map((t) => {
                const budget = parseFloat(t.total_budget || 0);
                const spent  = parseFloat(t.total_spent || 0);
                const pct    = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
                const isOver = budget > 0 && spent > budget;

                return (
                  <div key={t.id} className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-semibold text-xs truncate max-w-[180px]">{t.title}</h4>
                      {isOver ? (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-semibold uppercase">
                          <AlertTriangle size={10} /> Over Budget
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold uppercase">
                          On Track
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-slate-400">Spent: <strong className="text-slate-200">${spent.toLocaleString()}</strong></span>
                      <span className="text-slate-400">Budget: <strong className="text-slate-200">${budget.toLocaleString()}</strong></span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-800 rounded-sm overflow-hidden">
                      <div
                        className={`h-full rounded-sm transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                      <span>{pct}% utilized</span>
                      <button
                        onClick={() => navigate('/budget')}
                        className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-0.5"
                      >
                        Details <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Floating "+ Plan a trip" Button */}
      <Link
        to="/trips/new"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg transition-colors border border-blue-400/20"
      >
        <Plus size={16} />
        <span>Plan Trip</span>
      </Link>
    </div>
  );
}
