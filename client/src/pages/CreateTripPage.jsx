import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Map, Calendar, DollarSign, FileText, Image, Globe,
  MapPin, Compass, CheckCircle2, ChevronDown, Plus, Lock, AlertTriangle,
  ArrowRight, Check, Star
} from 'lucide-react';
import api from '../api/axios';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'];

const COVER_SUGGESTIONS = [
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800',
  'https://images.unsplash.com/photo-1539627831859-a911cf04d3cd?q=80&w=800',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=800',
];

export default function CreateTripPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    selected_place: '',
    description: '',
    start_date: '',
    end_date: '',
    total_budget: '',
    daily_budget_threshold: '',
    currency: 'USD',
    sharing_status: 'private',
    cover_image_url: '',
  });

  const [cities, setCities] = useState([]);
  const [catalogActivities, setCatalogActivities] = useState([]);
  const [selectedCover, setSelectedCover] = useState(null);
  const [suggestionTab, setSuggestionTab] = useState('all'); // 'all', 'places', 'activities'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // Destination mode: 'catalog' | 'custom'
  const [placeMode, setPlaceMode] = useState('catalog');
  const [customCityName, setCustomCityName] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [saveToCatalog, setSaveToCatalog] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/cities?sort=popular'),
      api.get('/activities-catalog'),
    ])
      .then(([citiesRes, actRes]) => {
        setCities(citiesRes.data.data?.cities || []);
        setCatalogActivities(actRes.data.data?.activities || []);
      })
      .catch((err) => console.error('[CreateTripPage] suggestion fetch error:', err));
  }, []);

  const set = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSelectPlace = (placeName) => {
    set('selected_place', placeName);
    const matchedCity = cities.find((c) => c.name.toLowerCase() === placeName.toLowerCase());
    if (matchedCity) {
      if (!form.title || form.title.startsWith('Trip to ')) {
        set('title', `Trip to ${matchedCity.name}`);
      }
      if (!form.cover_image_url && matchedCity.image_url) {
        setSelectedCover(matchedCity.image_url);
      }
    }
  };

  const handleCustomCityChange = (cityName) => {
    setCustomCityName(cityName);
    set('selected_place', cityName);
    if (!form.title || form.title.startsWith('Trip to ')) {
      set('title', cityName.trim() ? `Trip to ${cityName.trim()}` : '');
    }
  };

  const handleApplySuggestion = (item, type) => {
    setPlaceMode('catalog');
    if (type === 'city') {
      set('selected_place', item.name);
      setCustomCityName(item.name);
      setCustomCountry(item.country || '');
      if (!form.title || form.title.startsWith('Trip to ')) {
        set('title', `Trip to ${item.name}`);
      }
      if (item.image_url) {
        setSelectedCover(item.image_url);
        set('cover_image_url', '');
      }
      if (!form.description) {
        set('description', `Exploring ${item.name}, ${item.country}.`);
      }
    } else {
      const cityName = item.city_name || 'Destination';
      set('selected_place', cityName);
      setCustomCityName(cityName);
      if (!form.title || form.title.startsWith('Trip to ')) {
        set('title', `Trip to ${cityName}`);
      }
      if (item.image_url) {
        setSelectedCover(item.image_url);
        set('cover_image_url', '');
      }
      const existingDesc = form.description ? `${form.description}\n` : '';
      set('description', `${existingDesc}Planned activity: ${item.title} (${item.category || 'Experience'}).`);
    }

    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);
      if (end < start) {
        setErrors(['End date cannot be earlier than start date.']);
        return;
      }
    }

    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      total_budget: form.total_budget ? parseFloat(form.total_budget) : 0,
      daily_budget_threshold: form.daily_budget_threshold ? parseFloat(form.daily_budget_threshold) : undefined,
      currency: form.currency,
      sharing_status: form.sharing_status,
      cover_image_url: selectedCover || form.cover_image_url || undefined,
    };

    setLoading(true);
    try {
      const res = await api.post('/trips', payload);
      const tripId = res.data.tripId;

      const destinationCity = placeMode === 'custom' ? customCityName.trim() : form.selected_place.trim();
      if (destinationCity) {
        const cityMatch = cities.find((c) => c.name.toLowerCase() === destinationCity.toLowerCase());
        try {
          await api.post(`/trips/${tripId}/stops`, {
            city_id: cityMatch ? cityMatch.id : undefined,
            city_name: destinationCity,
            country: placeMode === 'custom' ? customCountry.trim() : (cityMatch?.country || undefined),
            country_code: cityMatch?.country_code || undefined,
            save_to_catalog: placeMode === 'custom' ? saveToCatalog : true,
            order_index: 0,
            budget: form.total_budget ? parseFloat(form.total_budget) : 0,
          });
        } catch (stopErr) {
          console.warn('[CreateTripPage] initial stop creation note:', stopErr);
        }
      }

      navigate(`/builder/${tripId}`);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setErrors([data?.message || 'Failed to create trip.']);
      setLoading(false);
    }
  };

  const previewImage = selectedCover || form.cover_image_url;

  const citySuggestions = cities.slice(0, 3).map((c) => ({ ...c, _type: 'city' }));
  const activitySuggestions = catalogActivities.slice(0, 3).map((a) => ({ ...a, _type: 'activity' }));

  let combinedSuggestions = [];
  if (suggestionTab === 'places') {
    combinedSuggestions = cities.slice(0, 6).map((c) => ({ ...c, _type: 'city' }));
  } else if (suggestionTab === 'activities') {
    combinedSuggestions = catalogActivities.slice(0, 6).map((a) => ({ ...a, _type: 'activity' }));
  } else {
    combinedSuggestions = [
      citySuggestions[0],
      activitySuggestions[0],
      citySuggestions[1],
      activitySuggestions[1],
      citySuggestions[2],
      activitySuggestions[2],
    ].filter(Boolean);
  }

  return (
    <div className="w-full px-4 md:px-8 pb-20 bg-[#0b0f17] text-slate-100">
      <div className="w-full max-w-4xl mx-auto space-y-6 pt-2">

        {/* Back navigation */}
        <Link
          to="/trips"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-semibold"
        >
          <ArrowLeft size={14} /> Back to My Trips
        </Link>

        {/* Trip Header */}
        <div className="p-6 md:p-8 rounded-xl border border-slate-800 bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <Compass size={13} />
              <span>Itinerary Setup</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Create Trip Record</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Configure destination, date parameters, and budget allocations. Detailed stop schedules can be configured in the builder.
            </p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
            <Map size={20} />
          </div>
        </div>

        {/* Error alert */}
        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-lg text-xs space-y-1">
            {errors.map((e, i) => (
              <p key={i} className="flex items-center gap-1.5 font-medium">
                <AlertTriangle size={13} /> {e}
              </p>
            ))}
          </div>
        )}

        {/* Main Create Trip Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Fields: Trip Name + Select a Place */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trip Name */}
            <div className="p-5 rounded-lg border border-slate-800 bg-[#111827] space-y-2">
              <label className="block text-slate-200 text-xs font-bold uppercase tracking-wider">
                Trip Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Summer in Tokyo & Kyoto"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-xs font-medium"
              />
              <p className="text-slate-500 text-[11px]">Primary title for this itinerary portfolio.</p>
            </div>

            {/* Select a Place / Destination City */}
            <div className="p-5 rounded-lg border border-slate-800 bg-[#111827] space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-1.5 text-slate-200 text-xs font-bold uppercase tracking-wider">
                  <MapPin size={13} className="text-blue-400" /> Destination Stop 1
                </label>
                {/* Switcher tabs */}
                <div className="flex items-center p-0.5 rounded-md bg-[#0b0f17] border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPlaceMode('catalog');
                      if (!form.selected_place && cities.length > 0) {
                        handleSelectPlace(cities[0].name);
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      placeMode === 'catalog'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Catalog ({cities.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaceMode('custom')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      placeMode === 'custom'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Plus size={11} /> Custom City
                  </button>
                </div>
              </div>

              {placeMode === 'catalog' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <select
                      value={form.selected_place}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__CUSTOM__') {
                          setPlaceMode('custom');
                        } else {
                          handleSelectPlace(val);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors text-xs font-medium appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[#111827] text-slate-400">Select catalog destination</option>
                      <option value="__CUSTOM__" className="bg-[#111827] text-blue-400 font-semibold">
                        + Enter Custom City / Destination...
                      </option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.name} className="bg-[#111827] text-white">
                          {c.name}, {c.country} ({c.region || 'Global'})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div>
                      {form.selected_place ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 size={11} /> Selected: {form.selected_place}
                        </span>
                      ) : (
                        <span>Pick a city or select a suggestion below.</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlaceMode('custom')}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Enter custom city
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 bg-[#0b0f17] p-3 rounded-lg border border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                        City Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required={placeMode === 'custom'}
                        placeholder="e.g. Zurich, Goa, Queenstown"
                        value={customCityName}
                        onChange={(e) => handleCustomCityChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                        Country <span className="text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Switzerland, India"
                        value={customCountry}
                        onChange={(e) => setCustomCountry(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-xs"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer pt-1 text-slate-300 text-xs select-none">
                    <input
                      type="checkbox"
                      checked={saveToCatalog}
                      onChange={(e) => setSaveToCatalog(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>
                      <strong className="text-slate-200 font-medium">Save to destination catalog</strong>
                      <span className="block text-slate-500 text-[11px]">
                        Stores this destination in MySQL for future itinerary selections.
                      </span>
                    </span>
                  </label>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPlaceMode('catalog')}
                      className="text-slate-400 hover:text-white transition-colors text-[11px]"
                    >
                      Back to catalog
                    </button>
                    {customCityName.trim() && (
                      <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                        <CheckCircle2 size={11} /> Ready: {customCityName.trim()}
                        {customCountry.trim() ? `, ${customCountry.trim()}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Travel Dates */}
          <div className="p-5 rounded-lg border border-slate-800 bg-[#111827]">
            <label className="flex items-center gap-2 text-slate-200 text-xs font-bold uppercase tracking-wider mb-3">
              <Calendar size={14} className="text-blue-400" /> Travel Window
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set('start_date', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark] text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) => set('end_date', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark] text-xs"
                />
              </div>
            </div>
            {form.start_date && form.end_date && new Date(form.end_date) < new Date(form.start_date) && (
              <p className="text-rose-400 text-xs mt-2.5 flex items-center gap-1.5 font-medium">
                <AlertTriangle size={12} /> End date cannot be earlier than start date.
              </p>
            )}
          </div>

          {/* Budget & Daily Alert Limit */}
          <div className="p-5 rounded-lg border border-slate-800 bg-[#111827]">
            <label className="flex items-center gap-2 text-slate-200 text-xs font-bold uppercase tracking-wider mb-3">
              <DollarSign size={14} className="text-emerald-400" /> Budget & Variance Limits
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Total Target Budget ({form.currency})</label>
                <div className="flex gap-2">
                  <select
                    value={form.currency}
                    onChange={(e) => set('currency', e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors text-xs font-semibold"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c} className="bg-[#111827] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.total_budget}
                    onChange={(e) => set('total_budget', e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-xs font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">
                  Daily Spending Threshold ({form.currency}) <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 200.00 / day"
                  value={form.daily_budget_threshold}
                  onChange={(e) => set('daily_budget_threshold', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-xs font-semibold"
                />
              </div>
            </div>
            <p className="text-slate-500 text-[11px] mt-2">
              Spending will be monitored against this target with live variance metrics.
            </p>
          </div>

          {/* Description */}
          <div className="p-5 rounded-lg border border-slate-800 bg-[#111827]">
            <label className="flex items-center gap-2 text-slate-200 text-xs font-bold uppercase tracking-wider mb-2">
              <FileText size={14} className="text-blue-400" /> Trip Description & Logistics
            </label>
            <textarea
              rows={3}
              placeholder="Logistics notes, primary goals, or transit details."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-xs resize-none"
            />
          </div>

          {/* Cover Photo Selection */}
          <div className="p-5 rounded-lg border border-slate-800 bg-[#111827]">
            <label className="flex items-center gap-2 text-slate-200 text-xs font-bold uppercase tracking-wider mb-3">
              <Image size={14} className="text-blue-400" /> Cover Photo
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-3">
              {COVER_SUGGESTIONS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    setSelectedCover(url);
                    set('cover_image_url', '');
                  }}
                  className={`relative h-20 rounded-lg overflow-hidden border transition-colors ${
                    selectedCover === url
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img src={url} alt="cover" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  {selectedCover === url && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                      <CheckCircle2 size={18} className="text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <input
              type="url"
              placeholder="Custom image URL: https://images.unsplash.com/..."
              value={form.cover_image_url}
              onChange={(e) => {
                set('cover_image_url', e.target.value);
                setSelectedCover(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-xs"
            />

            {previewImage && (
              <div className="mt-3 h-28 rounded-lg overflow-hidden border border-slate-800 relative bg-slate-900">
                <img
                  src={previewImage}
                  alt="preview"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.style.display = 'none')}
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-semibold border border-white/10">
                  Cover Preview
                </div>
              </div>
            )}
          </div>

          {/* Sharing Status */}
          <div className="p-5 rounded-lg border border-slate-800 bg-[#111827]">
            <label className="flex items-center gap-2 text-slate-200 text-xs font-bold uppercase tracking-wider mb-3">
              <Globe size={14} className="text-blue-400" /> Visibility Setting
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'private', icon: Lock, label: 'Private Itinerary', desc: 'Accessible only to your account' },
                { val: 'public', icon: Globe, label: 'Public & Community', desc: 'Listed in community feed and accessible via public link' },
              ].map(({ val, icon: Icon, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('sharing_status', val)}
                  className={`p-3.5 rounded-lg border text-left transition-colors ${
                    form.sharing_status === val
                      ? 'border-blue-500 bg-blue-600/10'
                      : 'border-slate-800 bg-[#0b0f17] hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-md bg-slate-800 text-blue-400 flex items-center justify-center mb-2">
                    <Icon size={16} />
                  </div>
                  <div className="text-white font-semibold text-xs">{label}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Link
              to="/trips"
              className="py-3 px-6 rounded-lg bg-[#1f2937] text-slate-300 hover:bg-slate-700 font-semibold text-center transition-colors border border-slate-700 text-xs"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Itinerary...</span>
                </>
              ) : (
                <>
                  <span>Create Trip & Open Builder</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggestions Grid */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-1">
                <Compass size={13} />
                <span>Catalog Recommendations</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Recommended Destinations & Activities
              </h2>
              <p className="text-slate-400 text-xs">
                Select any item to pre-fill destination details, suggested title, and cover artwork.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-lg border border-slate-800 text-xs flex-shrink-0">
              {[
                { id: 'all', label: 'All (6)' },
                { id: 'places', label: 'Destinations' },
                { id: 'activities', label: 'Activities' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSuggestionTab(tab.id)}
                  className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                    suggestionTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6-Card Visual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {combinedSuggestions.map((item, idx) => {
              const isPlace = item._type === 'city';
              const isSelected = isPlace
                ? form.selected_place.toLowerCase() === item.name.toLowerCase()
                : form.description?.includes(item.title);

              return (
                <div
                  key={`${item._type}-${item.id || idx}`}
                  onClick={() => handleApplySuggestion(item, item._type)}
                  className={`group overflow-hidden rounded-lg border transition-colors cursor-pointer flex flex-col justify-between bg-[#111827] ${
                    isSelected
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="relative h-32 overflow-hidden bg-slate-900">
                    <img
                      src={item.image_url}
                      alt={item.name || item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />

                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-900/90 text-white border border-slate-700">
                        {isPlace ? (
                          <>
                            <MapPin size={10} className="text-blue-400" /> Destination
                          </>
                        ) : (
                          <>
                            <Compass size={10} className="text-emerald-400" /> Activity
                          </>
                        )}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold">
                          <CheckCircle2 size={11} /> Applied
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-white font-semibold text-xs group-hover:text-blue-400 transition-colors line-clamp-1">
                        {item.name || item.title}
                      </h4>
                      <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                        {isPlace
                          ? `${item.country} • Score: ${item.popularity_score}`
                          : `${item.city_name || 'City'} • ${item.category || 'Experience'} • ~${item.duration_hours || 2} hrs`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-2">
                      <span className="text-emerald-400 font-semibold text-xs font-mono">
                        {isPlace
                          ? `$${item.avg_cost_per_day || 120}/day`
                          : `$${parseFloat(item.estimated_cost || 30).toFixed(0)} est.`}
                      </span>
                      <span className="text-[11px] font-medium text-blue-400 group-hover:text-blue-300 flex items-center gap-0.5">
                        {isSelected ? 'Selected' : 'Pre-fill Form'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
