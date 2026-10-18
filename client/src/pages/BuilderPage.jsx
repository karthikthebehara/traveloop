import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, MapPin, ChevronDown,
  ChevronRight, Clock, DollarSign, Tag, Globe, Lock,
  Check, X, Eye, Edit3, ArrowUp, ArrowDown, Sparkles, BookOpen, Search,
  Calendar, Landmark, Utensils, Plane, Building, Mountain, ShoppingBag,
  AlertTriangle, Compass, CheckCircle2, FileText
} from 'lucide-react';
import api from '../api/axios';

const CATEGORIES = ['sightseeing', 'food', 'transport', 'accommodation', 'adventure', 'shopping', 'other'];

function getCategoryIcon(cat, size = 18, className = 'text-slate-400') {
  switch (cat) {
    case 'sightseeing': return <Landmark size={size} className={className} />;
    case 'food': return <Utensils size={size} className={className} />;
    case 'transport': return <Plane size={size} className={className} />;
    case 'accommodation': return <Building size={size} className={className} />;
    case 'adventure': return <Mountain size={size} className={className} />;
    case 'shopping': return <ShoppingBag size={size} className={className} />;
    default: return <Tag size={size} className={className} />;
  }
}

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Activity Catalog Modal ─────────────────────────────────────
function ActivityCatalogModal({ stop, isOpen, onClose, onActivityAdded }) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [importingId, setImportingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchCatalog();
    }
  }, [isOpen, stop?.city_id]);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const url = stop?.city_id
        ? `/activities-catalog?city_id=${stop.city_id}`
        : '/activities-catalog';
      const res = await api.get(url);
      setCatalog(res.data.data?.activities || []);
    } catch (err) {
      console.error('[ActivityCatalogModal] fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (item) => {
    setImportingId(item.id);
    try {
      const res = await api.post(`/stops/${stop.id}/activities`, {
        activity_id: item.id,
        title: item.name,
        description: item.description,
        category: item.category,
        cost: parseFloat(item.estimated_cost) || 0,
        duration_hours: parseFloat(item.duration_hours) || 1.0,
        scheduled_date: stop.arrival_date || undefined,
        location_name: item.city_name || undefined,
        is_booked: false,
      });
      onActivityAdded(res.data.data.activity);
      onClose();
    } catch (err) {
      console.error('[ActivityCatalogModal] import error', err);
      alert('Failed to import activity.');
    } finally {
      setImportingId(null);
    }
  };

  if (!isOpen) return null;

  const filtered = catalog.filter(a => {
    if (selectedCat !== 'all' && a.category !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111827] w-full max-w-3xl rounded-xl border border-slate-800 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-blue-400" />
              Activity Catalog for {stop.city_name}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Select verified curated activities to instantly add to this stop
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row gap-3 flex-shrink-0">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog activities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Catalog items list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              No catalog activities found matching your criteria.
            </div>
          )}

          {!loading && filtered.map(item => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-slate-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                    {getCategoryIcon(item.category, 22, 'text-slate-400')}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm truncate">{item.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 mt-1">{item.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 font-medium">
                    <span className="text-emerald-400 font-bold">${parseFloat(item.estimated_cost || 0).toFixed(0)}</span>
                    <span>-</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {item.duration_hours} hrs</span>
                    {item.city_name && <span className="flex items-center gap-1"><MapPin size={11} /> {item.city_name}</span>}
                  </div>
                </div>
              </div>

              <button
                disabled={importingId === item.id}
                onClick={() => handleImport(item)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                {importingId === item.id ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={14} /> Add to Stop
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Activity Form ─────────────────────────────────────────────
function ActivityForm({ stop, trip, onAdded, onCancel }) {
  const minActDate = stop.arrival_date ? stop.arrival_date.split('T')[0] : (trip?.start_date ? trip.start_date.split('T')[0] : undefined);
  const maxActDate = stop.departure_date ? stop.departure_date.split('T')[0] : (trip?.end_date ? trip.end_date.split('T')[0] : undefined);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'sightseeing',
    cost: '',
    scheduled_date: stop.arrival_date ? stop.arrival_date.split('T')[0] : '',
    duration_hours: '1.5',
    start_time: '',
    location_name: '',
    booking_ref: '',
    is_booked: false,
  });
  const [saving, setSaving] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (form.scheduled_date) {
      if (minActDate && form.scheduled_date < minActDate) {
        alert(`Activity date (${form.scheduled_date}) cannot be earlier than ${stop.arrival_date ? 'stop arrival' : 'trip start'} date (${minActDate}).`);
        return;
      }
      if (maxActDate && form.scheduled_date > maxActDate) {
        alert(`Activity date (${form.scheduled_date}) cannot be after ${stop.departure_date ? 'stop departure' : 'trip end'} date (${maxActDate}).`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await api.post(`/stops/${stop.id}/activities`, {
        ...form,
        cost: parseFloat(form.cost) || 0,
        duration_hours: parseFloat(form.duration_hours) || 1.0,
        scheduled_date: form.scheduled_date || undefined,
        start_time: form.start_time ? new Date(`${form.scheduled_date || stop.arrival_date?.split('T')[0] || '2026-06-01'}T${form.start_time}:00`).toISOString() : undefined,
      });
      onAdded(res.data.data.activity);
    } catch (err) {
      console.error('[ActivityForm] save error', err);
      alert(err.response?.data?.message || 'Failed to save activity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-3.5 mt-3 shadow-md">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <h4 className="text-white font-bold text-sm flex items-center gap-2">
            <Plus size={14} className="text-blue-400" /> New Activity for {stop.city_name}
          </h4>
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/15 text-blue-300 hover:bg-blue-600/25 text-xs font-semibold transition-colors border border-blue-500/20"
          >
            <BookOpen size={12} /> Browse Catalog
          </button>
        </div>

        <input
          required
          autoFocus
          placeholder="Activity title * (e.g. Louvre Museum Guided Tour)"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Est. Cost ($)</label>
            <div className="relative">
              <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={form.cost}
                onChange={e => set('cost', e.target.value)}
                className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Duration (Hours)</label>
            <div className="relative">
              <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number" min="0.25" max="24" step="0.25" placeholder="1.5"
                value={form.duration_hours}
                onChange={e => set('duration_hours', e.target.value)}
                className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 text-xs mb-1 flex items-center justify-between">
              <span>Scheduled Date</span>
              {minActDate && maxActDate && (
                <span className="text-[10px] text-blue-300">({minActDate} to {maxActDate})</span>
              )}
            </label>
            <input
              type="date"
              value={form.scheduled_date}
              min={minActDate}
              max={maxActDate}
              onChange={e => set('scheduled_date', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Start Time (Optional)</label>
            <input
              type="time"
              value={form.start_time}
              onChange={e => set('start_time', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            placeholder="Location / Address (optional)"
            value={form.location_name}
            onChange={e => set('location_name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <input
            placeholder="Booking ref / ticket # (optional)"
            value={form.booking_ref}
            onChange={e => set('booking_ref', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <textarea
          rows={2}
          placeholder="Notes or tips for this activity (optional)"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />

        <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_booked}
            onChange={e => set('is_booked', e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 accent-blue-600 cursor-pointer"
          />
          <span>Mark as booked / confirmed</span>
        </label>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Check size={14} /> Add Activity</>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm transition-colors flex items-center gap-1"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </form>

      <ActivityCatalogModal
        stop={stop}
        isOpen={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onActivityAdded={onAdded}
      />
    </>
  );
}

// ── Stop Card ─────────────────────────────────────────────────
function StopCard({
  stop, idx, totalStops, trip,
  onMoveUp, onMoveDown, onDelete, onStopUpdated
}) {
  const [expanded, setExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [activities, setActivities] = useState(stop.activities || []);
  const [loadingActs, setLoadingActs] = useState(false);

  useEffect(() => {
    if (expanded && activities.length === 0 && !showForm) {
      loadActivities();
    }
  }, [expanded]);

  const loadActivities = async () => {
    setLoadingActs(true);
    try {
      const res = await api.get(`/stops/${stop.id}/activities`);
      setActivities(res.data.data?.activities || []);
    } catch (err) {
      console.error('[StopCard] load activities error', err);
    } finally {
      setLoadingActs(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!confirm('Remove this activity from itinerary?')) return;
    try {
      await api.delete(`/stops/${stop.id}/activities/${activityId}`);
      setActivities(prev => prev.filter(a => a.id !== activityId));
    } catch (err) {
      console.error('[StopCard] delete activity error', err);
    }
  };

  const totalCost = activities.reduce((sum, a) => sum + parseFloat(a.cost || 0), 0);

  return (
    <div className="bg-[#111827] rounded-xl overflow-hidden mb-4 border border-slate-800">
      {/* Stop header */}
      <div className="flex items-center gap-3 p-5">
        {/* Reorder Buttons */}
        <div className="flex flex-col gap-1 items-center flex-shrink-0">
          <button
            title="Move Stop Up"
            disabled={idx === 0}
            onClick={() => onMoveUp(idx)}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-slate-800 transition-colors"
          >
            <ArrowUp size={12} />
          </button>
          <button
            title="Move Stop Down"
            disabled={idx === totalStops - 1}
            onClick={() => onMoveDown(idx)}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-slate-800 transition-colors"
          >
            <ArrowDown size={12} />
          </button>
        </div>

        {/* Section Index Badge */}
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {idx + 1}
        </div>

        {/* Section Header with Date Range and Budget */}
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-xs uppercase tracking-wider">
                Section {idx + 1}
              </span>
              <h3 className="text-white font-bold text-lg truncate">{stop.city_name}</h3>
              {stop.country_code && (
                <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {stop.country_code}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
              <span className="text-slate-300 font-semibold">Date Range:</span>
              <span>{stop.arrival_date ? fmt(stop.arrival_date) : 'Start TBD'} to {stop.departure_date ? fmt(stop.departure_date) : 'End TBD'}</span>
              {activities.length > 0 && <span>- {activities.length} activit{activities.length === 1 ? 'y' : 'ies'}</span>}
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/30 flex items-center gap-2">
              <div className="text-left md:text-right">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Budget for this section
                </span>
                <span className="font-mono font-bold text-sm text-emerald-400">
                  ${totalCost > 0 ? totalCost.toFixed(0) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatalogModal(true)}
            title="Browse activity catalog for this city"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors border border-slate-700"
          >
            <BookOpen size={12} /> Catalog
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 text-xs font-semibold transition-colors border border-blue-500/20"
          >
            <Plus size={12} /> Activity
          </button>
          <button
            onClick={() => onDelete(stop.id)}
            title="Remove Section / Stop"
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setExpanded(p => !p)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Activity list */}
      {expanded && (
        <div className="px-5 pb-5">
          {loadingActs && (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
              <div className="w-4 h-4 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
              Loading activities...
            </div>
          )}

          {!loadingActs && activities.length === 0 && !showForm && (
            <div className="text-center py-6 text-slate-500 text-sm bg-slate-900 rounded-lg border border-slate-800 flex flex-col items-center justify-center gap-2">
              <p>No activities scheduled yet for {stop.city_name}.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCatalogModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors border border-slate-700 flex items-center gap-1"
                >
                  <BookOpen size={12} /> Import from Catalog
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 text-xs font-semibold transition-colors"
                >
                  + Add Custom Activity
                </button>
              </div>
            </div>
          )}

          {!loadingActs && activities.map(act => (
            <div key={act.id} className="flex items-start gap-3 py-3 border-b border-slate-800 last:border-0 group">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                {getCategoryIcon(act.category, 16, 'text-slate-300')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold text-sm truncate">{act.title}</span>
                  {act.is_booked === 1 && (
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                      Booked
                    </span>
                  )}
                  {act.scheduled_date && (
                    <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <Calendar size={10} /> {fmt(act.scheduled_date)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-xs mt-1">
                  <span className="capitalize">{act.category}</span>
                  {parseFloat(act.cost) > 0 && <span className="text-slate-300 font-semibold">- ${parseFloat(act.cost).toFixed(0)}</span>}
                  {act.duration_hours && <span className="flex items-center gap-1"><Clock size={10} /> {act.duration_hours} hrs</span>}
                  {act.location_name && <span className="flex items-center gap-1"><MapPin size={10} /> {act.location_name}</span>}
                </div>
              </div>
              <button
                onClick={() => handleDeleteActivity(act.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-500/15 rounded-lg transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {showForm && (
            <ActivityForm
              stop={stop}
              trip={trip}
              onAdded={a => { setActivities(p => [...p, a]); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}

      {/* Catalog modal */}
      <ActivityCatalogModal
        stop={stop}
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        onActivityAdded={a => setActivities(p => [...p, a])}
      />
    </div>
  );
}

// ── Add Stop Form ─────────────────────────────────────────────
function AddStopForm({ tripId, trip, onAdded, onCancel }) {
  const [mode, setMode] = useState('catalog'); // 'catalog' | 'custom'
  const [catalogCities, setCatalogCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [city_name, setCityName] = useState('');
  const [country, setCountry] = useState('');
  const [country_code, setCountryCode] = useState('');
  const [saveToCatalog, setSaveToCatalog] = useState(true);
  const [arrival_date, setArrivalDate] = useState('');
  const [departure_date, setDepartureDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);

  const tripStart = trip?.start_date ? trip.start_date.split('T')[0] : undefined;
  const tripEnd = trip?.end_date ? trip.end_date.split('T')[0] : undefined;

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await api.get('/cities');
      const list = res.data.data?.cities || [];
      setCatalogCities(list);
      if (list.length > 0) {
        setSelectedCityId(list[0].id.toString());
        setCityName(list[0].name);
        setCountry(list[0].country || '');
        setCountryCode(list[0].country_code || '');
      }
    } catch (err) {
      console.error('[AddStopForm] fetch cities error', err);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleCitySelect = (cId) => {
    setSelectedCityId(cId);
    const chosen = catalogCities.find(c => c.id.toString() === cId);
    if (chosen) {
      setCityName(chosen.name);
      setCountry(chosen.country || '');
      setCountryCode(chosen.country_code || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city_name.trim()) return;

    if (tripStart && arrival_date && arrival_date < tripStart) {
      alert(`Arrival date (${arrival_date}) cannot be earlier than trip start date (${tripStart}).`);
      return;
    }
    if (tripEnd && departure_date && departure_date > tripEnd) {
      alert(`Departure date (${departure_date}) cannot be after trip end date (${tripEnd}).`);
      return;
    }
    if (arrival_date && departure_date && departure_date < arrival_date) {
      alert(`Departure date (${departure_date}) cannot be earlier than arrival date (${arrival_date}).`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        city_id: mode === 'catalog' && selectedCityId ? parseInt(selectedCityId, 10) : undefined,
        city_name: city_name.trim(),
        country: mode === 'custom' ? (country.trim() || undefined) : undefined,
        country_code: country_code ? country_code.trim().toUpperCase() : undefined,
        save_to_catalog: mode === 'custom' ? saveToCatalog : true,
        arrival_date: arrival_date || undefined,
        departure_date: departure_date || undefined,
      };

      const res = await api.post(`/trips/${tripId}/stops`, payload);
      onAdded({ ...res.data.data.stop, activities: [] });
    } catch (err) {
      console.error('[AddStop] error', err);
      alert(err.response?.data?.message || 'Failed to add destination stop.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#111827] p-6 rounded-xl space-y-4 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h4 className="text-white font-bold text-sm flex items-center gap-2">
          <MapPin size={16} className="text-blue-400" /> Add a Destination Stop
        </h4>

        {/* Catalog vs Custom tab */}
        <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('catalog')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              mode === 'catalog' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            City Catalog
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('custom');
              setSelectedCityId('');
              setCityName('');
              setCountry('');
              setCountryCode('');
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              mode === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom City
          </button>
        </div>
      </div>

      {mode === 'catalog' ? (
        <div className="space-y-2">
          <label className="block text-slate-300 text-xs font-semibold mb-1.5">
            Select from Curated Global Destinations
          </label>
          <select
            value={selectedCityId}
            onChange={e => {
              const val = e.target.value;
              if (val === '__CUSTOM__') {
                setMode('custom');
                setSelectedCityId('');
                setCityName('');
                setCountry('');
                setCountryCode('');
              } else {
                handleCitySelect(val);
              }
            }}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors font-medium cursor-pointer"
          >
            <option value="__CUSTOM__" className="bg-slate-900 text-blue-400 font-bold">
              + Type Custom City / Destination...
            </option>
            {loadingCities ? (
              <option>Loading cities...</option>
            ) : (
              catalogCities.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.country} ({c.country_code}) - {c.region}
                </option>
              ))
            )}
          </select>
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>Or add a custom city destination:</span>
            <button
              type="button"
              onClick={() => {
                setMode('custom');
                setSelectedCityId('');
                setCityName('');
                setCountry('');
                setCountryCode('');
              }}
              className="text-blue-400 hover:text-blue-300 underline font-medium"
            >
              + Type custom city
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 bg-slate-900 p-3.5 rounded-lg border border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 text-xs mb-1">City Name *</label>
              <input
                required autoFocus
                placeholder="e.g. Zurich, Goa, Kyoto"
                value={city_name}
                onChange={e => setCityName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Country</label>
              <input
                placeholder="e.g. Switzerland"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Save to Catalog Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs select-none">
            <input
              type="checkbox"
              checked={saveToCatalog}
              onChange={e => setSaveToCatalog(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Save this city to global destination catalog for future trips</span>
          </label>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 text-xs mb-1 flex items-center justify-between">
            <span>Arrival Date</span>
            {tripStart && <span className="text-[10px] text-blue-300">Min: {tripStart}</span>}
          </label>
          <input
            type="date"
            value={arrival_date}
            min={tripStart}
            max={tripEnd}
            onChange={e => setArrivalDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1 flex items-center justify-between">
            <span>Departure Date</span>
            {tripEnd && <span className="text-[10px] text-blue-300">Max: {tripEnd}</span>}
          </label>
          <input
            type="date"
            value={departure_date}
            min={arrival_date || tripStart}
            max={tripEnd}
            onChange={e => setDepartureDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving || !city_name.trim()}
          className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>+ Add Stop to Itinerary</>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main BuilderPage ──────────────────────────────────────────
export default function BuilderPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStop, setShowAddStop] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => { fetchData(); }, [tripId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripRes, stopsRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/trips/${tripId}/stops`),
      ]);
      setTrip(tripRes.data.data.trip);
      setStops(stopsRes.data.data?.stops || []);
    } catch (err) {
      console.error('[Builder] fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStop = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    const newStops = [...stops];
    const [moved] = newStops.splice(index, 1);
    newStops.splice(targetIndex, 0, moved);

    setStops(newStops);

    try {
      const payload = {
        stops: newStops.map((s, idx) => ({ id: s.id, order_index: idx })),
      };
      const res = await api.patch(`/trips/${tripId}/stops/reorder`, payload);
      if (res.data.data?.stops) {
        setStops(res.data.data.stops);
      }
    } catch (err) {
      console.error('[Builder] reorder error', err);
      fetchData();
    }
  };

  const handleDeleteStop = async (stopId) => {
    if (!confirm('Remove this destination stop and all its scheduled activities?')) return;
    try {
      await api.delete(`/trips/${tripId}/stops/${stopId}`);
      setStops(prev => prev.filter(s => s.id !== stopId));
    } catch (err) {
      console.error('[Builder] delete stop error', err);
    }
  };

  const handleToggleSharing = async () => {
    setSharing(true);
    try {
      const res = await api.patch(`/trips/${tripId}/share`);
      setTrip(prev => ({ ...prev, sharing_status: res.data.data.sharing_status }));
    } catch (err) {
      console.error('[Builder] share toggle error', err);
    } finally {
      setSharing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-[#111827] border border-slate-800 p-12 text-center rounded-xl">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading itinerary builder...</p>
      </div>
    </div>
  );

  if (!trip) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-[#111827] border border-slate-800 p-12 text-center rounded-xl max-w-md">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-white font-bold text-xl mb-2">Trip not found</p>
        <Link to="/trips" className="text-blue-400 hover:underline text-sm font-semibold">
          Back to My Trips
        </Link>
      </div>
    </div>
  );

  const isPublic = trip.sharing_status === 'public';

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-4xl mx-auto">

        {/* Back Link */}
        <Link
          to="/trips"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft size={16} /> My Trips
        </Link>

        {/* Trip Header Banner */}
        <div className="bg-[#111827] border border-slate-800 p-6 md:p-8 rounded-xl mb-6 relative overflow-hidden">
          {trip.cover_image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-15"
              style={{ backgroundImage: `url(${trip.cover_image_url})` }}
            />
          )}
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2 block">
                Itinerary Builder
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{trip.title}</h1>
              {trip.description && <p className="text-slate-300 text-sm max-w-xl mb-3">{trip.description}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                {trip.start_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-400" />
                    {fmt(trip.start_date)}{trip.end_date && ` to ${fmt(trip.end_date)}`}
                  </span>
                )}
                {trip.total_budget > 0 && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign size={14} className="text-emerald-400" />
                    Budget: {trip.currency} {Number(trip.total_budget).toLocaleString()}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  {stops.length} destination stop{stops.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleToggleSharing}
                disabled={sharing}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors ${
                  isPublic
                    ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {isPublic ? <Globe size={13} /> : <Lock size={13} />}
                {isPublic ? 'Public' : 'Private'}
              </button>
              <button
                onClick={() => navigate(`/trips/${tripId}/view`)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 border border-blue-500/30 font-semibold text-xs transition-colors"
              >
                <Eye size={13} /> Preview
              </button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {stops.length === 0 && !showAddStop && (
          <div className="bg-[#111827] border border-slate-800 p-12 text-center rounded-xl mb-6">
            <Compass className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No destinations planned yet</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">
              Add your first city stop from our global catalog or enter a custom city to start assembling your itinerary!
            </p>
            <button
              onClick={() => setShowAddStop(true)}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              + Add First Destination Stop
            </button>
          </div>
        )}

        {/* Stops list with reordering */}
        {stops.map((stop, idx) => (
          <StopCard
            key={stop.id}
            stop={stop}
            idx={idx}
            totalStops={stops.length}
            trip={trip}
            onMoveUp={(i) => handleMoveStop(i, -1)}
            onMoveDown={(i) => handleMoveStop(i, 1)}
            onDelete={handleDeleteStop}
          />
        ))}

        {/* Add another Section button */}
        {showAddStop ? (
          <AddStopForm
            tripId={tripId}
            trip={trip}
            onAdded={s => { setStops(prev => [...prev, s]); setShowAddStop(false); }}
            onCancel={() => setShowAddStop(false)}
          />
        ) : (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setShowAddStop(true)}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Add another Section
            </button>
          </div>
        )}

        {/* Quick links to companion pages */}
        {stops.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { to: `/budget`, icon: DollarSign, label: 'Budget & Costs' },
              { to: `/checklist`, icon: CheckCircle2, label: 'Packing List' },
              { to: `/notes`, icon: FileText, label: 'Trip Notes' },
            ].map(({ to, icon: IconComponent, label }) => (
              <Link
                key={to}
                to={to}
                className="bg-[#111827] border border-slate-800 p-4 text-center rounded-xl hover:border-slate-700 transition-colors"
              >
                <IconComponent size={20} className="text-blue-400 mx-auto mb-1.5" />
                <div className="text-slate-300 text-sm font-semibold">{label}</div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

