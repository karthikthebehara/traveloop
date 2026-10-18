import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Compass, DollarSign, Clock, MapPin, Tag, Plus, Eye,
  Check, X, Calendar, AlertTriangle, ArrowRight, Landmark, Utensils,
  Mountain, ShoppingBag
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { val: 'all', label: 'All Categories' },
  { val: 'sightseeing', label: 'Sightseeing' },
  { val: 'food', label: 'Food & Dining' },
  { val: 'adventure', label: 'Outdoor & Adventure' },
  { val: 'shopping', label: 'Shopping & Markets' },
  { val: 'other', label: 'Cultural & Heritage' },
];

const CategoryBadge = ({ category }) => {
  const map = {
    sightseeing: { icon: Landmark, color: 'text-blue-400 bg-blue-500/10' },
    food: { icon: Utensils, color: 'text-amber-400 bg-amber-500/10' },
    adventure: { icon: Mountain, color: 'text-emerald-400 bg-emerald-500/10' },
    shopping: { icon: ShoppingBag, color: 'text-pink-400 bg-pink-500/10' },
    other: { icon: Tag, color: 'text-slate-400 bg-slate-500/10' },
  };
  const item = map[category] || { icon: Tag, color: 'text-slate-400 bg-slate-500/10' };
  const Icon = item.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${item.color} border border-white/5`}>
      <Icon size={11} />
      <span>{category}</span>
    </span>
  );
};

export default function ActivitySearchPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse initial query params
  const searchParams = new URLSearchParams(location.search);
  const initialCityId = searchParams.get('city_id') || '';

  const [activities, setActivities] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(initialCityId);
  const [category, setCategory] = useState('all');
  const [maxCost, setMaxCost] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [sort, setSort] = useState('');

  // Quick View Modal
  const [quickViewAct, setQuickViewAct] = useState(null);

  // Add to Stop Modal
  const [addModalAct, setAddModalAct] = useState(null);
  const [userTrips, setUserTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [tripStops, setTripStops] = useState([]);
  const [selectedStopId, setSelectedStopId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [addingAct, setAddingAct] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    api
      .get('/cities')
      .then((res) => setCities(res.data.data?.cities || []))
      .catch((err) => console.error('[Load cities error]', err));
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [search, selectedCity, category, maxCost, maxDuration, sort]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.q = search.trim();
      if (selectedCity) params.city_id = selectedCity;
      if (category && category !== 'all') params.category = category;
      if (maxCost) params.max_cost = maxCost;
      if (maxDuration) params.max_duration = maxDuration;
      if (sort) params.sort = sort;

      const res = await api.get('/activities-catalog', { params });
      setActivities(res.data.data?.activities || []);
    } catch (err) {
      console.error('[Activities fetch error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = async (act) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setAddModalAct(act);
    setModalSuccess('');
    setModalError('');
    setScheduledDate('');
    setStartTime('');
    setSelectedStopId('');

    try {
      const res = await api.get('/trips');
      const trips = res.data.data?.trips || [];
      setUserTrips(trips);
      if (trips.length > 0) {
        setSelectedTripId(trips[0].id);
        loadStopsForTrip(trips[0].id);
      }
    } catch (err) {
      console.error('[Load trips error]', err);
    }
  };

  const loadStopsForTrip = async (tripId) => {
    try {
      const res = await api.get(`/trips/${tripId}/stops`);
      const stops = res.data.data?.stops || [];
      setTripStops(stops);
      if (stops.length > 0) {
        setSelectedStopId(stops[0].id);
        if (stops[0].arrival_date) {
          setScheduledDate(stops[0].arrival_date.slice(0, 10));
        }
      } else {
        setSelectedStopId('');
      }
    } catch (err) {
      console.error('[Load stops error]', err);
    }
  };

  const handleTripChange = (tripId) => {
    setSelectedTripId(tripId);
    loadStopsForTrip(tripId);
  };

  const handleAddActivitySubmit = async (e) => {
    e.preventDefault();
    if (!selectedStopId) {
      setModalError('Please create or select a city stop in this trip first.');
      return;
    }

    const targetStop = tripStops.find((s) => s.id === parseInt(selectedStopId, 10));
    const targetTrip = userTrips.find((t) => t.id === parseInt(selectedTripId, 10));

    if (scheduledDate) {
      const minDate = targetStop?.arrival_date?.split('T')[0] || targetTrip?.start_date?.split('T')[0];
      const maxDate = targetStop?.departure_date?.split('T')[0] || targetTrip?.end_date?.split('T')[0];

      if (minDate && scheduledDate < minDate) {
        setModalError(`Activity date (${scheduledDate}) cannot be earlier than ${targetStop?.arrival_date ? 'stop arrival' : 'trip start'} date (${minDate}).`);
        return;
      }
      if (maxDate && scheduledDate > maxDate) {
        setModalError(`Activity date (${scheduledDate}) cannot be after ${targetStop?.departure_date ? 'stop departure' : 'trip end'} date (${maxDate}).`);
        return;
      }
    }

    setAddingAct(true);
    setModalError('');
    try {
      await api.post(`/stops/${selectedStopId}/activities`, {
        activity_id:    addModalAct.id,
        title:          addModalAct.name,
        category:       addModalAct.category,
        cost:           parseFloat(addModalAct.estimated_cost) || 0,
        duration_hours: parseFloat(addModalAct.duration_hours) || 2.0,
        scheduled_date: scheduledDate || undefined,
        start_time:     startTime ? `${scheduledDate || '2026-06-01'}T${startTime}:00Z` : undefined,
        location_name:  `${addModalAct.city_name}, ${addModalAct.country_name}`,
      });

      setModalSuccess(`Added "${addModalAct.name}" to itinerary stop`);
      setTimeout(() => {
        setAddModalAct(null);
        navigate(`/builder/${selectedTripId}`);
      }, 1000);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to add activity.');
    } finally {
      setAddingAct(false);
    }
  };

  return (
    <div className="w-full px-4 md:px-8 pb-20 bg-[#0b0f17] text-slate-100">
      <div className="w-full max-w-7xl mx-auto space-y-6 pt-2">

        {/* Hero Section */}
        <div className="p-6 md:p-8 rounded-xl border border-slate-800 bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <Compass size={13} />
              <span>Activity & Experience Directory</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Curated Activities & Attractions
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Explore verified cultural tours, museums, dining, and outdoor excursions across world destinations. Add experiences directly to any trip stop.
            </p>
          </div>
          <button
            onClick={() => navigate('/cities')}
            className="px-4 py-2 rounded-lg bg-[#1f2937] hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <Compass size={14} className="text-blue-400" /> Destination Catalog
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#111827] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Keyword Search */}
            <div className="md:col-span-4 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search activities or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* City Selector */}
            <div className="md:col-span-3">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs transition-colors"
              >
                <option value="" className="bg-[#111827] text-white">All Destinations</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#111827] text-white">
                    {c.name}, {c.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.val} value={c.val} className="bg-[#111827] text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Cost Filter */}
            <div className="md:col-span-2">
              <select
                value={maxCost}
                onChange={(e) => setMaxCost(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs transition-colors"
              >
                <option value="" className="bg-[#111827] text-white">Any Price</option>
                <option value="0" className="bg-[#111827] text-white">Free Activities ($0)</option>
                <option value="30" className="bg-[#111827] text-white">Under $30</option>
                <option value="60" className="bg-[#111827] text-white">Under $60</option>
                <option value="100" className="bg-[#111827] text-white">Under $100</option>
              </select>
            </div>
          </div>

          {/* Secondary Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Max Duration:</span>
              {['', '2', '3.5', '5'].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setMaxDuration(dur)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    maxDuration === dur
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#0b0f17] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {dur === '' ? 'Any' : `< ${dur}h`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Sort By:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-2.5 py-1 rounded-md bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="" className="bg-[#111827]">Featured</option>
                <option value="cost_asc" className="bg-[#111827]">Lowest Price</option>
                <option value="cost_desc" className="bg-[#111827]">Highest Price</option>
                <option value="duration_asc" className="bg-[#111827]">Shortest Duration</option>
                <option value="name" className="bg-[#111827]">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Found <strong className="text-slate-200">{activities.length}</strong> catalog experiences</span>
          {category !== 'all' && <span>Category: <strong className="text-blue-400 capitalize">{category}</strong></span>}
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl h-72 bg-[#111827] border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-slate-800 bg-[#111827] space-y-2">
            <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Compass size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">No activities match your filters</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Try clearing search terms or selecting a broader price bracket.
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCity(''); setCategory('all'); setMaxCost(''); setMaxDuration(''); }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map((act) => {
              const costVal = parseFloat(act.estimated_cost);
              return (
                <div
                  key={act.id}
                  className="group rounded-xl overflow-hidden border border-slate-800 bg-[#111827] hover:border-slate-700 transition-colors flex flex-col justify-between"
                >
                  {/* Image header */}
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img
                      src={act.image_url}
                      alt={act.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />

                    {/* Category pill */}
                    <div className="absolute top-2.5 left-2.5">
                      <CategoryBadge category={act.category} />
                    </div>

                    {/* Price pill */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        costVal === 0
                          ? 'bg-emerald-600 text-white'
                          : 'bg-black/70 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {costVal === 0 ? 'FREE' : `$${costVal.toFixed(0)}`}
                      </span>
                    </div>

                    {/* City pin */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="flex items-center gap-1 text-white text-[11px] font-medium bg-black/70 px-2 py-0.5 rounded">
                        <MapPin size={10} className="text-blue-400" />
                        {act.city_name}, {act.country_name}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1 leading-snug">
                        {act.name}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {act.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {act.duration_hours}h duration
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => setQuickViewAct(act)}
                        className="py-2 px-3 rounded-lg bg-[#1f2937] hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <Eye size={12} /> Details
                      </button>
                      <button
                        onClick={() => handleOpenAddModal(act)}
                        className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus size={12} /> Add to Stop
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick View Modal */}
        {quickViewAct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="max-w-xl w-full rounded-xl overflow-hidden border border-slate-800 bg-[#111827] shadow-2xl relative">
              <button
                onClick={() => setQuickViewAct(null)}
                className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-lg bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <X size={16} />
              </button>

              <div className="relative h-56 overflow-hidden bg-slate-900">
                <img
                  src={quickViewAct.image_url}
                  alt={quickViewAct.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="mb-1.5">
                    <CategoryBadge category={quickViewAct.category} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{quickViewAct.name}</h3>
                </div>
              </div>

              <div className="p-5 space-y-3.5">
                <p className="text-slate-300 text-xs leading-relaxed">
                  {quickViewAct.description}
                </p>

                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-[#0b0f17] border border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Location</span>
                    <span className="text-white font-medium">{quickViewAct.city_name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Duration</span>
                    <span className="text-white font-medium">{quickViewAct.duration_hours} Hours</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Estimated Cost</span>
                    <span className="text-emerald-400 font-mono font-semibold">
                      {parseFloat(quickViewAct.estimated_cost) === 0 ? 'FREE' : `$${parseFloat(quickViewAct.estimated_cost).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    onClick={() => { setQuickViewAct(null); handleOpenAddModal(quickViewAct); }}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add to Itinerary Stop
                  </button>
                  <button
                    onClick={() => setQuickViewAct(null)}
                    className="px-4 py-2 rounded-lg bg-[#1f2937] hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add to Trip Stop Modal */}
        {addModalAct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="max-w-md w-full rounded-xl p-6 relative border border-slate-800 bg-[#111827] shadow-2xl space-y-4">
              <button
                onClick={() => setAddModalAct(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white truncate max-w-xs">{addModalAct.name}</h3>
                  <p className="text-slate-400 text-xs">Assign this activity to a destination stop</p>
                </div>
              </div>

              {modalSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                  <Check size={14} /> {modalSuccess}
                </div>
              )}

              {modalError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-1.5">
                  <AlertTriangle size={14} /> {modalError}
                </div>
              )}

              {userTrips.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-slate-400 text-xs">You do not have any trips created yet.</p>
                  <button
                    onClick={() => { setAddModalAct(null); navigate('/trips/new'); }}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    Create a Trip
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddActivitySubmit} className="space-y-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">
                      1. Select Trip *
                    </label>
                    <select
                      value={selectedTripId}
                      onChange={(e) => handleTripChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs transition-colors"
                    >
                      {userTrips.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#111827] text-white">
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">
                      2. Select City Stop *
                    </label>
                    {tripStops.length === 0 ? (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                        This trip has no destination stops.{' '}
                        <button
                          type="button"
                          onClick={() => { setAddModalAct(null); navigate(`/builder/${selectedTripId}`); }}
                          className="font-bold underline text-white ml-1"
                        >
                          Open builder to add stops
                        </button>
                      </div>
                    ) : (
                      <select
                        value={selectedStopId}
                        onChange={(e) => setSelectedStopId(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs transition-colors"
                      >
                        {tripStops.map((s) => (
                          <option key={s.id} value={s.id} className="bg-[#111827] text-white">
                            {s.city_name} {s.arrival_date ? `(${new Date(s.arrival_date).toLocaleDateString()})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {(() => {
                      const targetStop = tripStops.find((s) => s.id === parseInt(selectedStopId, 10));
                      const targetTrip = userTrips.find((t) => t.id === parseInt(selectedTripId, 10));
                      const minDate = targetStop?.arrival_date?.split('T')[0] || targetTrip?.start_date?.split('T')[0];
                      const maxDate = targetStop?.departure_date?.split('T')[0] || targetTrip?.end_date?.split('T')[0];
                      return (
                        <div>
                          <label className="block text-slate-400 text-xs font-medium mb-1">
                            Scheduled Date
                          </label>
                          <input
                            type="date"
                            value={scheduledDate}
                            min={minDate}
                            max={maxDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs [color-scheme:dark]"
                          />
                        </div>
                      );
                    })()}
                    <div>
                      <label className="block text-slate-400 text-xs font-medium mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex gap-2.5">
                    <button
                      type="submit"
                      disabled={addingAct || !selectedStopId}
                      className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {addingAct ? 'Assigning...' : 'Add to Stop'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddModalAct(null)}
                      className="px-3.5 py-2 rounded-lg bg-[#1f2937] hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
