import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, DollarSign, Clock, Globe, Lock,
  Edit3, Printer, CheckCircle2, ChevronRight, LayoutGrid, List,
  CalendarDays, Sparkles, Plus, Share2, ArrowDown, Copy, Check,
  Landmark, Utensils, Plane, Building, Mountain, ShoppingBag, Tag,
  AlertTriangle, Mail, X
} from 'lucide-react';
import api from '../api/axios';

const CATEGORY_STYLES = {
  sightseeing:   { icon: Landmark, text: 'text-blue-400', bg: 'bg-blue-500/10' },
  food:          { icon: Utensils, text: 'text-amber-400', bg: 'bg-amber-500/10' },
  transport:     { icon: Plane, text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  accommodation: { icon: Building, text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  adventure:     { icon: Mountain, text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  shopping:      { icon: ShoppingBag, text: 'text-pink-400', bg: 'bg-pink-500/10' },
  other:         { icon: Tag, text: 'text-slate-400', bg: 'bg-slate-500/10' },
};

function fmt(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateShort(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtWeekday(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
}

function fmtTime(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function toIsoDate(d) {
  if (!d) return null;
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const TIME_SLOTS = [
  { label: '08:00 AM - 10:00 AM', slot: 'morning' },
  { label: '10:00 AM - 01:00 PM', slot: 'midday' },
  { label: '01:00 PM - 03:00 PM', slot: 'afternoon_early' },
  { label: '03:00 PM - 06:00 PM', slot: 'afternoon_late' },
  { label: '06:00 PM - 09:00 PM', slot: 'evening' },
  { label: '09:00 PM onwards',    slot: 'night' },
];

export default function ItineraryViewPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'calendar' | 'list'
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentMsg, setEmailSentMsg] = useState(null);

  useEffect(() => { fetchItinerary(); }, [tripId]);

  const fetchItinerary = async () => {
    setLoading(true);
    try {
      const [tripRes, stopsRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/trips/${tripId}/stops`),
      ]);
      const tripData = tripRes.data.data.trip;
      const stopsData = stopsRes.data.data?.stops || [];

      // Fetch activities for each stop
      const stopsWithActs = await Promise.all(
        stopsData.map(async s => {
          try {
            const aRes = await api.get(`/stops/${s.id}/activities`);
            return { ...s, activities: aRes.data.data?.activities || [] };
          } catch {
            return { ...s, activities: [] };
          }
        })
      );

      setTrip(tripData);
      setStops(stopsWithActs);
    } catch (err) {
      setError('Failed to load itinerary. Please try again.');
      console.error('[ItineraryView]', err);
    } finally {
      setLoading(false);
    }
  };

  const ensurePublicAndGetUrl = async () => {
    if (trip.sharing_status !== 'public') {
      const res = await api.patch(`/trips/${tripId}/share`);
      setTrip(prev => ({ ...prev, sharing_status: res.data.data.sharing_status }));
    }
    return `${window.location.origin}/public/${tripId}`;
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = await ensurePublicAndGetUrl();
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch (err) {
      console.error('[Share]', err);
      alert('Could not copy share link.');
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      const shareUrl = await ensurePublicAndGetUrl();
      const text = encodeURIComponent(`Explore my travel itinerary "${trip.title}" on Traveloop: ${shareUrl}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    } catch (err) {
      console.error('[WhatsApp Share]', err);
      alert('Could not open WhatsApp share.');
    }
  };

  const handleShareTwitter = async () => {
    try {
      const shareUrl = await ensurePublicAndGetUrl();
      const text = encodeURIComponent(`Explore my travel itinerary "${trip.title}" on Traveloop`);
      const url = encodeURIComponent(shareUrl);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    } catch (err) {
      console.error('[Twitter Share]', err);
      alert('Could not open Twitter share.');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!recipientEmail) return;
    setEmailSending(true);
    setEmailSentMsg(null);
    try {
      await ensurePublicAndGetUrl();
      const res = await api.post(`/trips/${tripId}/share-email`, { email: recipientEmail });
      setEmailSentMsg({ type: 'success', text: res.data.message || `Itinerary sent to ${recipientEmail}!` });
      setRecipientEmail('');
    } catch (err) {
      console.error('[Share Email]', err);
      setEmailSentMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send itinerary email.' });
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-[#111827] border border-slate-800 p-12 text-center rounded-xl">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Assembling your complete itinerary...</p>
      </div>
    </div>
  );

  if (error || !trip) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-[#111827] border border-slate-800 p-12 text-center max-w-md rounded-xl">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-white font-bold text-xl mb-2">{error || 'Trip not found'}</p>
        <Link to="/trips" className="text-blue-400 hover:underline text-sm font-semibold">
          Back to My Trips
        </Link>
      </div>
    </div>
  );

  const totalCost = stops.reduce(
    (sum, s) => sum + s.activities.reduce((a, b) => a + parseFloat(b.cost || 0), 0), 0
  );
  const totalActivities = stops.reduce((sum, s) => sum + s.activities.length, 0);
  const isPublic = trip.sharing_status === 'public';

  const getTripDates = () => {
    let startStr = trip.start_date;
    let endStr = trip.end_date;

    if (!startStr && stops.length > 0 && stops[0].arrival_date) {
      startStr = stops[0].arrival_date;
    }
    if (!endStr && stops.length > 0) {
      const last = stops[stops.length - 1];
      endStr = last.departure_date || last.arrival_date;
    }

    if (!startStr) {
      const today = new Date();
      return [today, new Date(today.getTime() + 86400000), new Date(today.getTime() + 172800000)];
    }
    if (!endStr) endStr = startStr;

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    const days = [];
    let cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const final = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    let safety = 0;
    while (cur <= final && safety < 14) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
      safety++;
    }
    return days;
  };

  const calendarDays = getTripDates();
  const allActivities = stops.flatMap(s => s.activities.map(a => ({ ...a, stopName: s.city_name })));

  return (
    <div className="w-full px-4 md:px-8 pb-36">
      <div className="w-full max-w-6xl mx-auto space-y-8">

        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <Link
            to="/trips"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> My Trips
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/builder/${tripId}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 font-semibold text-xs transition-colors"
            >
              <Edit3 size={14} /> Open Builder
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 font-semibold text-xs transition-colors"
            >
              <Printer size={14} /> Print Itinerary
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-[#111827] rounded-xl overflow-hidden relative border border-slate-800 shadow-xl">
          {trip.cover_image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${trip.cover_image_url})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
          <div className="relative z-10 p-6 md:p-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2 block">
              Trip Itinerary View & Summary
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{trip.title}</h1>
            {trip.description && <p className="text-slate-300 max-w-2xl mb-6 text-sm leading-relaxed">{trip.description}</p>}

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <MapPin size={16} className="text-blue-400" />
                <span className="font-semibold text-white">{stops.length}</span> Section{stops.length !== 1 ? 's' : ''} / Cities
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Calendar size={16} className="text-blue-400" />
                {trip.start_date ? `${fmt(trip.start_date)}${trip.end_date ? ` to ${fmt(trip.end_date)}` : ''}` : 'Dates TBD'}
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Sparkles size={16} className="text-blue-400" />
                <span className="font-semibold text-white">{totalActivities}</span> Scheduled Activities
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <DollarSign size={16} className="text-emerald-400" />
                Total Est. <span className="font-bold text-emerald-300">${totalCost.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <span className={isPublic ? 'text-emerald-400' : 'text-slate-400'}>
                  {isPublic ? <Globe size={16} /> : <Lock size={16} />}
                </span>
                <span className="capitalize">{trip.sharing_status}</span>
              </div>
            </div>
          </div>

          {/* 3-Way View toggle bar */}
          <div className="relative z-10 border-t border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock size={13} /> Day-wise Itinerary View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarDays size={13} /> Time-Slot Schedule Table
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List size={13} /> Summary List
              </button>
            </div>

            {isPublic && (
              <Link
                to={`/public/${tripId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
              >
                <Globe size={12} /> View Public Web Page
              </Link>
            )}
          </div>
        </div>

        {/* View Mode 1: Day-wise Itinerary View */}
        {viewMode === 'timeline' && (
          <div className="space-y-8">
            {stops.length === 0 ? (
              <div className="bg-[#111827] p-12 text-center rounded-xl border border-slate-800 text-slate-400">
                No sections or activities in this itinerary yet.
              </div>
            ) : (
              stops.map((stop, stopIdx) => {
                const stopTotal = stop.activities.reduce((s, a) => s + parseFloat(a.cost || 0), 0);

                const dateMap = {};
                stop.activities.forEach(act => {
                  const key = act.scheduled_date ? toIsoDate(act.scheduled_date) : 'Flexible';
                  if (!dateMap[key]) dateMap[key] = [];
                  dateMap[key].push(act);
                });

                const dayKeys = Object.keys(dateMap).sort();

                return (
                  <div key={stop.id} className="bg-[#111827] rounded-xl overflow-hidden border border-slate-800 shadow-md">
                    {/* Section Header */}
                    <div className="p-6 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                          {stopIdx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-xs uppercase tracking-wider">
                              Section {stopIdx + 1}
                            </span>
                            <h2 className="text-xl font-bold text-white">{stop.city_name}</h2>
                            {stop.country_code && (
                              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                {stop.country_code}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-xs mt-1">
                            {stop.arrival_date ? `Date Range: ${fmt(stop.arrival_date)} to ${fmt(stop.departure_date)}` : 'Dates TBD'} - {stop.activities.length} Activities
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-400 text-xs block">Budget for this Section</span>
                        <span className="text-xl font-bold text-emerald-400">${stopTotal.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Activities List */}
                    <div className="p-6 space-y-6">
                      {stop.activities.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                          No activities added to this section yet. Use the Builder to add activities.
                        </div>
                      ) : (
                        dayKeys.map((dayKey, dIdx) => {
                          const acts = dateMap[dayKey];
                          const dayTotal = acts.reduce((sum, a) => sum + parseFloat(a.cost || 0), 0);

                          return (
                            <div key={dayKey} className="flex flex-col md:flex-row items-start gap-6 pt-4 first:pt-0 border-t border-slate-800/60 first:border-0">
                              {/* Left Column: Day Badge */}
                              <div className="w-full md:w-36 flex-shrink-0">
                                <div className="sticky top-28 p-3 rounded-lg bg-slate-900 border border-slate-800 text-center space-y-1">
                                  <span className="inline-block px-2.5 py-1 rounded-md bg-blue-600 text-white font-bold text-xs uppercase tracking-wider">
                                    Day {dIdx + 1}
                                  </span>
                                  <p className="text-white font-semibold text-xs">
                                    {dayKey === 'Flexible' ? 'Flexible Day' : fmt(dayKey)}
                                  </p>
                                  <span className="text-[11px] text-emerald-400 font-mono block">
                                    ${dayTotal.toFixed(0)} est.
                                  </span>
                                </div>
                              </div>

                              {/* Center & Right Column: Activity Card + Expense Pill */}
                              <div className="flex-1 w-full space-y-3">
                                {acts.map((act, aIdx) => {
                                  const cat = CATEGORY_STYLES[act.category] || CATEGORY_STYLES.other;
                                  const IconComponent = cat.icon;
                                  return (
                                    <div key={act.id}>
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors group">
                                        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                                            <IconComponent size={18} className={cat.text} />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <p className="text-white font-semibold text-sm truncate group-hover:text-blue-300 transition-colors">
                                                {act.title}
                                              </p>
                                              {act.is_booked === 1 && (
                                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
                                                  Booked
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-400 text-xs mt-1 flex-wrap">
                                              <span className="capitalize">{act.category}</span>
                                              {act.start_time && (
                                                <span className="flex items-center gap-1 text-slate-300 font-medium">
                                                  <Clock size={11} className="text-slate-400" /> {fmtTime(act.start_time)}
                                                </span>
                                              )}
                                              {act.duration_hours && (
                                                <span className="flex items-center gap-1 text-slate-400">
                                                  <Clock size={11} /> {act.duration_hours} hr{act.duration_hours !== 1 ? 's' : ''}
                                                </span>
                                              )}
                                              {act.location_name && (
                                                <span className="flex items-center gap-1 text-slate-400">
                                                  <MapPin size={11} /> {act.location_name}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-end flex-shrink-0">
                                          <div className="px-3.5 py-1.5 rounded-md bg-slate-950 border border-emerald-500/30 text-right min-w-[90px]">
                                            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Expense</span>
                                            <span className="text-emerald-400 font-mono font-bold text-sm">
                                              {parseFloat(act.cost) > 0 ? `$${parseFloat(act.cost).toFixed(2)}` : 'Free'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {aIdx < acts.length - 1 && (
                                        <div className="flex justify-center my-1.5">
                                          <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                                            <ArrowDown size={11} />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* View Mode 2: Time-Slot Table */}
        {viewMode === 'calendar' && (
          <div className="bg-[#111827] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarDays size={18} className="text-blue-400" /> Time-Slot Schedule Matrix
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Synchronized hourly time-slot matrix across your journey days
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[700px]">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-xs uppercase tracking-wider">
                    <th className="p-3 w-48 text-slate-400 font-semibold border-r border-slate-800">Time</th>
                    {calendarDays.map((d, i) => (
                      <th key={i} className="p-3 text-white font-bold border-r border-slate-800 last:border-r-0">
                        <span className="text-blue-400 block text-[10px]">Day {i + 1}</span>
                        {fmtWeekday(d)} ({fmtDateShort(d)})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {TIME_SLOTS.map((slot, sIdx) => (
                    <tr key={slot.slot} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 font-semibold text-slate-300 bg-slate-950/40 border-r border-slate-800 whitespace-nowrap">
                        <Clock size={12} className="inline mr-1.5 text-blue-400" />
                        {slot.label}
                      </td>

                      {calendarDays.map((d, dIdx) => {
                        const dayIso = toIsoDate(d);
                        const actsOnDay = allActivities.filter(a => toIsoDate(a.scheduled_date) === dayIso);
                        const slotAct = actsOnDay[sIdx];

                        return (
                          <td key={dIdx} className="p-2.5 border-r border-slate-800 last:border-r-0 align-top h-24">
                            {slotAct ? (
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold capitalize">
                                    {slotAct.category}
                                  </span>
                                  <span className="text-emerald-400 font-mono font-semibold text-[11px]">
                                    ${parseFloat(slotAct.cost || 0).toFixed(0)}
                                  </span>
                                </div>
                                <p className="text-white font-semibold text-xs line-clamp-1">{slotAct.title}</p>
                                <p className="text-slate-400 text-[10px] flex items-center gap-1">
                                  <MapPin size={10} /> {slotAct.stopName}
                                </p>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-600 text-[11px] italic">
                                - Open -
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Mode 3: Summary List View */}
        {viewMode === 'list' && stops.length > 0 && (
          <div className="bg-[#111827] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Destination Section</th>
                    <th className="p-4">Arrival</th>
                    <th className="p-4">Departure</th>
                    <th className="p-4 text-center">Activities Count</th>
                    <th className="p-4 text-right">Section Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {stops.map((stop, idx) => {
                    const stopTotal = stop.activities.reduce((s, a) => s + parseFloat(a.cost || 0), 0);
                    return (
                      <tr key={stop.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-white font-semibold">Section {idx + 1}: {stop.city_name}</p>
                              {stop.country_code && <p className="text-slate-400 text-xs">{stop.country_code}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300">{fmt(stop.arrival_date) || '-'}</td>
                        <td className="p-4 text-slate-300">{fmt(stop.departure_date) || '-'}</td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
                            {stop.activities.length}
                          </span>
                        </td>
                        <td className="p-4 text-right text-emerald-400 font-bold">${stopTotal.toFixed(0)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-900/80 font-semibold border-t border-slate-800">
                    <td className="p-4 text-slate-200">Grand Total</td>
                    <td colSpan={2} className="p-4 text-slate-400 text-xs">
                      {stops.length} destination stops
                    </td>
                    <td className="p-4 text-center text-slate-300">
                      {totalActivities} activities
                    </td>
                    <td className="p-4 text-right text-emerald-400 text-base">
                      ${totalCost.toFixed(0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 md:px-8 py-3.5 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-white font-semibold text-sm">
              {trip.title}
            </span>
            <span className="text-slate-400 text-xs hidden md:inline">
              - {stops.length} Sections - ${totalCost.toFixed(0)} Total Expense
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => navigate(`/builder/${tripId}`)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs md:text-sm border border-slate-800 transition-colors"
            >
              <Plus size={16} /> Add Activity
            </button>

            <button
              onClick={() => navigate(`/builder/${tripId}`)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs md:text-sm border border-slate-800 transition-colors"
            >
              <Edit3 size={16} /> Edit Itinerary
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs md:text-sm border border-blue-500 transition-colors"
            >
              <Share2 size={16} /> Share Itinerary
            </button>
          </div>
        </div>
      </div>

      {/* Share Itinerary Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 size={16} className="text-blue-400" /> Share Itinerary
              </h3>
              <button
                onClick={() => { setShowShareModal(false); setEmailSentMsg(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Anyone with this public link can view your itinerary timeline, scheduled activities, and destination sections.
            </p>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors"
              >
                WhatsApp
              </button>
              <button
                onClick={handleShareTwitter}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold border border-sky-500/20 transition-colors"
              >
                X / Twitter
              </button>
            </div>

            {/* Direct Copy Link */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Public Web Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/public/${tripId}`}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  {shareCopied ? (
                    <>
                      <Check size={14} className="text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Send Itinerary via Email Form */}
            <form onSubmit={handleSendEmail} className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Send via Email</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={emailSending}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Mail size={14} />
                  {emailSending ? 'Sending...' : 'Send'}
                </button>
              </div>
              {emailSentMsg && (
                <p className={`text-xs ${emailSentMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {emailSentMsg.text}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

