import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Globe, Calendar, MapPin, Copy, Check, Share2, Printer,
  DollarSign, Clock, ArrowRight, Lock, Landmark, Utensils,
  Plane, Building, Mountain, ShoppingBag, Tag
} from 'lucide-react';

const CategoryIcon = ({ category, size = 15 }) => {
  switch (category) {
    case 'sightseeing':
      return <Landmark size={size} className="text-blue-400" />;
    case 'food':
      return <Utensils size={size} className="text-amber-400" />;
    case 'transport':
      return <Plane size={size} className="text-sky-400" />;
    case 'accommodation':
      return <Building size={size} className="text-emerald-400" />;
    case 'adventure':
      return <Mountain size={size} className="text-orange-400" />;
    case 'shopping':
      return <ShoppingBag size={size} className="text-pink-400" />;
    default:
      return <Tag size={size} className="text-slate-400" />;
  }
};

function fmt(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SharedTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchPublicTrip();
  }, [tripId]);

  const fetchPublicTrip = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/trips/public/${tripId}`);
      const data = res.data.data;
      setTrip(data.trip);
      setStops(data.stops || []);
      setError('');
    } catch (err) {
      console.error('[SharedTrip] fetch error', err);
      setError('This itinerary is private, does not exist, or has been unpublished by the creator.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Check out this travel itinerary for ${trip?.title || 'a trip'}: ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Check out this travel itinerary: "${trip?.title}" planned on Traveloop`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleCloneTrip = async () => {
    setCopying(true);
    try {
      const res = await api.post(`/trips/copy/${tripId}`);
      const newTrip = res.data.data?.trip;
      alert(`Trip copied to your account successfully! You can now customize your itinerary.`);
      navigate(`/builder/${newTrip.id}`);
    } catch (err) {
      console.error('[SharedTrip] copy error', err);
      const msg = err.response?.data?.message || 'Failed to copy trip. Please make sure you are logged in.';
      alert(msg);
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#0b0f17]">
        <div className="p-8 text-center rounded-xl border border-slate-800 bg-[#111827]">
          <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-300 text-xs font-semibold">Loading public itinerary...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 bg-[#0b0f17]">
        <div className="p-10 text-center max-w-md rounded-xl border border-slate-800 bg-[#111827] space-y-3">
          <div className="w-12 h-12 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">Trip Not Available</h2>
          <p className="text-slate-400 text-xs">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors w-full"
          >
            Explore Public Destinations
          </button>
        </div>
      </div>
    );
  }

  const totalActivities = stops.reduce((sum, s) => sum + (s.activities?.length || 0), 0);
  const totalCost = stops.reduce(
    (sum, s) => sum + (s.activities || []).reduce((a, b) => a + parseFloat(b.cost || 0), 0), 0
  );

  return (
    <div className="w-full px-4 md:px-8 pb-20 bg-[#0b0f17] text-slate-100">
      <div className="w-full max-w-5xl mx-auto space-y-6 pt-2">

        {/* Hero Section */}
        <div className="rounded-xl overflow-hidden relative border border-slate-800 bg-[#111827]">
          {trip.cover_image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${trip.cover_image_url})` }}
            />
          )}
          <div className="relative z-10 p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <Globe size={11} /> Public Itinerary
              </span>
              {trip.owner_name && (
                <span className="text-xs text-slate-400">
                  Curated by <strong className="text-slate-200">{trip.owner_name}</strong>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-2">
              {trip.title}
            </h1>
            {trip.description && (
              <p className="text-slate-400 max-w-2xl text-xs md:text-sm mb-4 leading-relaxed">
                {trip.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-3 border-t border-slate-800">
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <MapPin size={14} className="text-blue-400" />
                {stops.length} Stop{stops.length !== 1 ? 's' : ''}
              </span>
              {(trip.start_date || trip.end_date) && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  {fmt(trip.start_date)}{trip.end_date && ` - ${fmt(trip.end_date)}`}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" />
                {totalActivities} Planned Activit{totalActivities !== 1 ? 'ies' : 'y'}
              </span>
              {totalCost > 0 && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
                  <DollarSign size={14} /> Est. Activities: ${totalCost.toFixed(0)}
                </span>
              )}
            </div>
          </div>

          {/* Social Share & Clone Bar */}
          <div className="relative z-10 border-t border-slate-800 bg-[#0b0f17] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Share2 size={12} /> Share:
              </span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111827] text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium transition-colors border border-slate-800"
              >
                {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copiedLink ? 'Copied' : 'Copy Link'}
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 text-xs font-medium transition-colors border border-emerald-500/20"
              >
                WhatsApp
              </button>
              <button
                onClick={handleShareTwitter}
                className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs font-medium transition-colors border border-sky-500/20"
              >
                X / Twitter
              </button>
              <button
                onClick={() => window.print()}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111827] text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-800"
              >
                <Printer size={12} /> Print
              </button>
            </div>

            <button
              disabled={copying}
              onClick={handleCloneTrip}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 ml-auto"
            >
              {copying ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Copy size={13} /> Copy Trip to My Account
                </>
              )}
            </button>
          </div>
        </div>

        {/* Itinerary Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} className="text-blue-400" /> Complete Route Schedule
            </h2>
            <span className="text-xs text-slate-400">{stops.length} destinations</span>
          </div>

          {stops.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-slate-800 bg-[#111827]">
              <p className="text-slate-400 text-xs">No destination stops have been detailed in this itinerary yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stops.map((stop, idx) => (
                <div key={stop.id} className="rounded-xl overflow-hidden border border-slate-800 bg-[#111827]">
                  {/* Stop Header */}
                  <div className="p-4 bg-[#0b0f17] border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{stop.city_name}</h3>
                          {stop.country_code && (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {stop.country_code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                          {stop.arrival_date && <span>{fmt(stop.arrival_date)}</span>}
                          {stop.arrival_date && stop.departure_date && <span>-</span>}
                          {stop.departure_date && <span>{fmt(stop.departure_date)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stop Activities */}
                  <div className="p-4">
                    {!stop.activities || stop.activities.length === 0 ? (
                      <p className="text-slate-500 text-xs py-1">No individual activities scheduled for this stop.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {stop.activities.map((act) => (
                          <div
                            key={act.id}
                            className="p-3 rounded-lg bg-[#0b0f17] border border-slate-800 flex items-start gap-2.5"
                          >
                            <div className="mt-0.5">
                              <CategoryIcon category={act.category} size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-white font-semibold text-xs truncate">{act.title}</h4>
                              {act.description && (
                                <p className="text-slate-400 text-[11px] line-clamp-2 mt-0.5">{act.description}</p>
                              )}
                              <div className="flex items-center gap-2.5 text-slate-500 text-[10px] mt-1 font-medium">
                                <span className="capitalize">{act.category}</span>
                                {act.duration_hours && <span>• {act.duration_hours}h</span>}
                                {parseFloat(act.cost) > 0 && (
                                  <span className="text-emerald-400 font-mono font-semibold">
                                    • ${parseFloat(act.cost).toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA Card */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#111827] text-center space-y-2.5">
          <h3 className="text-lg font-bold text-white">Inspired by this route?</h3>
          <p className="text-slate-400 text-xs max-w-lg mx-auto">
            Duplicate this complete itinerary - including destinations, activities, and packing checklists - into your personal workspace.
          </p>
          <div className="pt-2">
            <button
              disabled={copying}
              onClick={handleCloneTrip}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <span>{copying ? 'Copying...' : 'Copy Trip to Workspace'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
