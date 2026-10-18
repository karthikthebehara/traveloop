import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Heart, Plus, Compass, Check, Calendar, ArrowRight, X, Star, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const REGIONS = ['All', 'Europe', 'Asia', 'North America', 'Middle East', 'Oceania', 'South America', 'Africa'];

export default function CitySearchPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [cities, setCities]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [region, setRegion]         = useState('All');
  const [sort, setSort]             = useState('popular');
  const [maxCost, setMaxCost]       = useState('');
  const [savingId, setSavingId]     = useState(null);

  // Add to Trip Modal State
  const [modalCity, setModalCity]   = useState(null);
  const [trips, setTrips]           = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [arrivalDate, setArrivalDate]       = useState('');
  const [departureDate, setDepartureDate]   = useState('');
  const [addingStop, setAddingStop]         = useState(false);
  const [modalSuccess, setModalSuccess]     = useState('');
  const [modalError, setModalError]         = useState('');

  useEffect(() => {
    fetchCities();
  }, [search, region, sort, maxCost]);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.q = search.trim();
      if (region && region !== 'All') params.region = region;
      if (sort) params.sort = sort;
      if (maxCost) params.max_cost = maxCost;

      const res = await api.get('/cities', { params });
      setCities(res.data.data?.cities || []);
    } catch (err) {
      console.error('[CitySearch] fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (city, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSavingId(city.id);
    const wasSaved = city.is_saved;

    setCities((prev) => prev.map((c) => (c.id === city.id ? { ...c, is_saved: !wasSaved } : c)));

    try {
      if (wasSaved) {
        await api.delete(`/profile/saved-destinations/${city.id}`);
      } else {
        await api.post('/profile/saved-destinations', { city_id: city.id });
      }
    } catch (err) {
      console.error('[Bookmark error]', err);
      setCities((prev) => prev.map((c) => (c.id === city.id ? { ...c, is_saved: wasSaved } : c)));
    } finally {
      setSavingId(null);
    }
  };

  const handleOpenAddModal = async (city) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setModalCity(city);
    setModalSuccess('');
    setModalError('');
    setArrivalDate('');
    setDepartureDate('');

    try {
      const res = await api.get('/trips');
      const userTrips = res.data.data?.trips || [];
      setTrips(userTrips);
      if (userTrips.length > 0) {
        setSelectedTripId(userTrips[0].id);
      }
    } catch (err) {
      console.error('[Load trips for modal]', err);
    }
  };

  const handleAddStopSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTripId) {
      setModalError('Please select a trip first.');
      return;
    }

    const targetTrip = trips.find((t) => t.id === parseInt(selectedTripId, 10));
    if (targetTrip?.start_date && arrivalDate) {
      const tripStart = targetTrip.start_date.split('T')[0];
      if (arrivalDate < tripStart) {
        setModalError(`Arrival date (${arrivalDate}) cannot be earlier than trip start date (${tripStart}).`);
        return;
      }
    }
    if (targetTrip?.end_date && departureDate) {
      const tripEnd = targetTrip.end_date.split('T')[0];
      if (departureDate > tripEnd) {
        setModalError(`Departure date (${departureDate}) cannot be after trip end date (${tripEnd}).`);
        return;
      }
    }
    if (arrivalDate && departureDate && departureDate < arrivalDate) {
      setModalError(`Departure date (${departureDate}) cannot be earlier than arrival date (${arrivalDate}).`);
      return;
    }

    setAddingStop(true);
    setModalError('');
    try {
      await api.post(`/trips/${selectedTripId}/stops`, {
        city_id:        modalCity.id,
        city_name:      modalCity.name,
        country_code:   modalCity.country_code,
        arrival_date:   arrivalDate || undefined,
        departure_date: departureDate || undefined,
      });

      setModalSuccess(`Successfully added ${modalCity.name} to itinerary`);
      setTimeout(() => {
        setModalCity(null);
        navigate(`/builder/${selectedTripId}`);
      }, 1000);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to add stop to trip.');
    } finally {
      setAddingStop(false);
    }
  };

  const costIndexLabel = (idx) => {
    const num = parseInt(idx, 10) || 3;
    if (num <= 2) return 'Budget ($50/day or less)';
    if (num === 3) return 'Moderate ($150/day or less)';
    if (num === 4) return 'Premium ($300/day or less)';
    return 'Luxury ($500+/day)';
  };

  return (
    <div className="w-full px-4 md:px-8 pb-20 bg-[#0b0f17] text-slate-100">
      <div className="w-full max-w-7xl mx-auto space-y-6 pt-2">

        {/* Hero Section */}
        <div className="p-6 md:p-8 rounded-xl border border-slate-800 bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <Compass size={13} />
              <span>Global Destination Catalog</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Explore Destinations & Cities
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Discover international cities, evaluate regional daily expense benchmarks, and attach destinations into your itineraries.
            </p>
          </div>
          <button
            onClick={() => navigate('/activities')}
            className="px-4 py-2 rounded-lg bg-[#1f2937] hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <Compass size={14} className="text-blue-400" /> Catalog Activities
          </button>
        </div>

        {/* Search & Filters Control Bar */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#111827] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by city name, country, or description..."
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

            {/* Region Dropdown */}
            <div className="md:col-span-3">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs transition-colors"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r} className="bg-[#111827] text-white">
                    {r === 'All' ? 'All Regions' : r}
                  </option>
                ))}
              </select>
            </div>

            {/* Cost Index Dropdown */}
            <div className="md:col-span-2">
              <select
                value={maxCost}
                onChange={(e) => setMaxCost(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs transition-colors"
              >
                <option value="" className="bg-[#111827] text-white">Any Budget</option>
                <option value="2" className="bg-[#111827] text-white">Budget ($50/day or less)</option>
                <option value="3" className="bg-[#111827] text-white">Moderate ($150/day or less)</option>
                <option value="4" className="bg-[#111827] text-white">Premium ($300/day or less)</option>
                <option value="5" className="bg-[#111827] text-white">Luxury ($500+/day)</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="md:col-span-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs transition-colors"
              >
                <option value="popular" className="bg-[#111827]">Popularity</option>
                <option value="cost_asc" className="bg-[#111827]">Lowest Cost</option>
                <option value="cost_desc" className="bg-[#111827]">Highest Cost</option>
                <option value="name" className="bg-[#111827]">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Found <strong className="text-slate-200">{cities.length}</strong> catalog destinations</span>
          {region !== 'All' && <span>Region: <strong className="text-blue-400">{region}</strong></span>}
        </div>

        {/* Cities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl h-80 bg-[#111827] border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : cities.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-slate-800 bg-[#111827] space-y-2">
            <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Compass size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">No destinations match your search</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Try adjusting your query or reset the regional filter.
            </p>
            <button
              onClick={() => { setSearch(''); setRegion('All'); setMaxCost(''); }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((city) => {
              const costString = costIndexLabel(city.cost_index);
              return (
                <div
                  key={city.id}
                  className="group rounded-xl overflow-hidden border border-slate-800 bg-[#111827] hover:border-slate-700 transition-colors flex flex-col justify-between"
                >
                  {/* City Image Header */}
                  <div className="relative h-48 overflow-hidden bg-slate-900">
                    <img
                      src={city.image_url}
                      alt={city.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold border border-white/10">
                        {city.region}
                      </span>
                    </div>

                    {/* Bookmark Button */}
                    <button
                      onClick={(e) => handleToggleBookmark(city, e)}
                      disabled={savingId === city.id}
                      className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        city.is_saved
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-black/70 text-white/80 hover:text-white border border-white/10'
                      }`}
                      title={city.is_saved ? 'Remove bookmark' : 'Bookmark destination'}
                    >
                      <Heart size={15} className={city.is_saved ? 'fill-current' : ''} />
                    </button>

                    {/* Metadata inside Image */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight drop-shadow">
                          {city.name}
                        </h3>
                        <p className="text-slate-300 text-xs font-medium flex items-center gap-1 drop-shadow">
                          <MapPin size={11} className="text-blue-400" />
                          {city.country} {city.country_code && `(${city.country_code})`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/80 text-amber-300 text-[10px] font-semibold border border-white/10">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          {city.popularity_score}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                      {city.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span>Benchmark:</span>
                        <span className="font-semibold text-emerald-400">{costString}</span>
                      </div>
                      <div>
                        <span className="bg-[#0b0f17] text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-800">
                          {city.activity_count || 0} activities
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => navigate(`/activities?city_id=${city.id}`)}
                        className="py-2 px-3 rounded-lg bg-[#1f2937] hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <Compass size={12} /> Activities
                      </button>
                      <button
                        onClick={() => handleOpenAddModal(city)}
                        className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus size={12} /> Add to Trip
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add to Trip Modal */}
        {modalCity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="max-w-md w-full rounded-xl p-5 relative border border-slate-800 bg-[#111827] shadow-2xl space-y-4">
              <button
                onClick={() => setModalCity(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add {modalCity.name}</h3>
                  <p className="text-slate-400 text-xs">Append this destination to an existing trip</p>
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

              {trips.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-slate-400 text-xs">You have not created any trips yet.</p>
                  <button
                    onClick={() => { setModalCity(null); navigate('/trips/new'); }}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    Create Your First Trip
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddStopSubmit} className="space-y-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">
                      Select Target Trip *
                    </label>
                    <select
                      value={selectedTripId}
                      onChange={(e) => setSelectedTripId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs transition-colors"
                    >
                      {trips.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#111827] text-white">
                          {t.title} ({t.start_date ? new Date(t.start_date).toLocaleDateString() : 'Dates TBD'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const activeTrip = trips.find((t) => t.id === parseInt(selectedTripId, 10));
                    return (
                      <>
                        {activeTrip?.start_date && (
                          <p className="text-[11px] text-blue-400 font-medium">
                            Trip Window: {new Date(activeTrip.start_date).toLocaleDateString()}
                            {activeTrip.end_date ? ` - ${new Date(activeTrip.end_date).toLocaleDateString()}` : ''}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-slate-400 text-xs font-medium mb-1 flex items-center gap-1">
                              <Calendar size={11} /> Arrival Date
                            </label>
                            <input
                              type="date"
                              value={arrivalDate}
                              min={activeTrip?.start_date ? activeTrip.start_date.split('T')[0] : undefined}
                              max={activeTrip?.end_date ? activeTrip.end_date.split('T')[0] : undefined}
                              onChange={(e) => setArrivalDate(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs [color-scheme:dark]"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 text-xs font-medium mb-1 flex items-center gap-1">
                              <Calendar size={11} /> Departure Date
                            </label>
                            <input
                              type="date"
                              value={departureDate}
                              min={arrivalDate || (activeTrip?.start_date ? activeTrip.start_date.split('T')[0] : undefined)}
                              max={activeTrip?.end_date ? activeTrip.end_date.split('T')[0] : undefined}
                              onChange={(e) => setDepartureDate(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-xs [color-scheme:dark]"
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <div className="pt-3 flex gap-2.5">
                    <button
                      type="submit"
                      disabled={addingStop}
                      className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {addingStop ? 'Adding Destination...' : 'Add Stop to Trip'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalCity(null)}
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
