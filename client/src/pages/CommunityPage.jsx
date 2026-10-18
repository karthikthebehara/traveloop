import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe, Search, Filter, Copy, Eye, MapPin,
  Calendar, DollarSign, Share2, Shield, X
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [communityTrips, setCommunityTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Top control bar filters
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [sortBy, setSortBy] = useState('newest');

  // Actions
  const [copyingId, setCopyingId] = useState(null);
  const [moderatingId, setModeratingId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [userTrips, setUserTrips] = useState([]);
  const [selectedUserTripId, setSelectedUserTripId] = useState('');
  const [sharingLoading, setSharingLoading] = useState(false);

  useEffect(() => {
    fetchCommunityTrips();
  }, []);

  const fetchCommunityTrips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trips/community');
      setCommunityTrips(res.data.data?.trips || []);
      setError('');
    } catch (err) {
      console.error('[CommunityPage] fetch error', err);
      setError('Failed to load community travel feed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShareModal = async () => {
    setShowShareModal(true);
    try {
      const res = await api.get('/trips');
      const trips = res.data.data?.trips || [];
      setUserTrips(trips);
      if (trips.length > 0) setSelectedUserTripId(trips[0].id.toString());
    } catch (err) {
      console.error('[CommunityPage] fetch user trips error', err);
    }
  };

  const handleShareTrip = async (e) => {
    e.preventDefault();
    if (!selectedUserTripId) return;
    setSharingLoading(true);
    try {
      await api.patch(`/trips/${selectedUserTripId}/share`);
      alert('Trip visibility updated to Public! It is now featured on the Community feed.');
      setShowShareModal(false);
      fetchCommunityTrips();
    } catch (err) {
      console.error('[CommunityPage] share error', err);
      alert('Failed to publish trip.');
    } finally {
      setSharingLoading(false);
    }
  };

  const handleCopyTrip = async (tripId) => {
    setCopyingId(tripId);
    try {
      const res = await api.post(`/trips/copy/${tripId}`);
      const newTrip = res.data.data?.trip;
      alert(`Trip copied to your dashboard!`);
      navigate(`/builder/${newTrip.id}`);
    } catch (err) {
      console.error('[CommunityPage] copy error', err);
      alert(err.response?.data?.message || 'Failed to copy trip. Ensure you are logged in.');
    } finally {
      setCopyingId(null);
    }
  };

  const handleShareWhatsApp = (trip) => {
    const url = `${window.location.origin}/public/${trip.id}`;
    const text = encodeURIComponent(`Check out this travel itinerary for "${trip.title}" on Traveloop: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTwitter = (trip) => {
    const url = `${window.location.origin}/public/${trip.id}`;
    const text = encodeURIComponent(`Check out this travel itinerary: "${trip.title}" planned on Traveloop`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleModerateUnpublish = async (tripId) => {
    if (!window.confirm('Administrator Action: Remove this trip from the public community feed?')) return;
    setModeratingId(tripId);
    try {
      await api.patch(`/trips/${tripId}/share`, { sharing_status: 'private' });
      setCommunityTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) {
      alert('Failed to unpublish trip: ' + (err.response?.data?.message || err.message));
    } finally {
      setModeratingId(null);
    }
  };

  const filteredTrips = communityTrips
    .filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchCreator = t.creator_name?.toLowerCase().includes(q);
        const matchCity = t.creator_city?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCreator && !matchCity) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'budget_high') return (parseFloat(b.total_budget) || 0) - (parseFloat(a.total_budget) || 0);
      if (sortBy === 'stops') return (b.stop_count || 0) - (a.stop_count || 0);
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

  return (
    <div className="w-full px-4 md:px-8 pb-20 bg-[#0b0f17] text-slate-100">
      <div className="w-full max-w-7xl mx-auto space-y-6 pt-2">

        {/* Hero Section */}
        <div className="p-6 md:p-8 rounded-xl border border-slate-800 bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-blue-600/10 text-blue-400 border border-blue-500/20">
                <Globe size={11} /> Global Traveler Community
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Community Travel Itineraries
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Discover verified travel routes published by other travelers. One-click duplicate any itinerary into your workspace to modify stops and schedule activities.
            </p>
          </div>

          <button
            onClick={handleOpenShareModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors flex-shrink-0"
          >
            <Share2 size={14} /> Publish Trip
          </button>
        </div>

        {/* Control Bar */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#111827] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search community trips by destination, creator, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#0b0f17] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <span className="text-slate-400 font-medium">Group:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="none" className="bg-[#111827] text-white">None</option>
                <option value="budget" className="bg-[#111827] text-white">Budget Level</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0b0f17] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <Filter size={12} className="text-slate-400" />
              <span className="text-slate-400 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-[#111827] text-white">Newest First</option>
                <option value="budget_high" className="bg-[#111827] text-white">Budget (High to Low)</option>
                <option value="stops" className="bg-[#111827] text-white">Most Destinations</option>
                <option value="title" className="bg-[#111827] text-white">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Social Feed List */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs">Loading community itineraries...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-slate-800 bg-[#111827] space-y-2">
            <Globe size={36} className="text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No community itineraries found</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Share your planned journey to feature it on the community feed.
            </p>
            <button
              onClick={handleOpenShareModal}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors mt-2"
            >
              Publish a Trip
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-xl border border-slate-800 bg-[#111827] p-5 flex flex-col md:flex-row items-start gap-5 hover:border-slate-700 transition-colors group"
              >
                {/* Creator Avatar Column */}
                <div className="flex flex-row md:flex-col items-center gap-2.5 flex-shrink-0">
                  <div className="relative">
                    {trip.creator_avatar ? (
                      <img
                        src={trip.creator_avatar}
                        alt={trip.creator_name}
                        loading="lazy"
                        decoding="async"
                        className="w-12 h-12 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-sm">
                        {trip.creator_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="text-left md:text-center">
                    <p className="text-xs font-semibold text-white truncate max-w-[100px]">{trip.creator_name}</p>
                    {trip.creator_city && (
                      <p className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                        <MapPin size={9} /> {trip.creator_city}
                      </p>
                    )}
                  </div>
                </div>

                {/* Cover Image Thumbnail */}
                <div className="w-full md:w-52 h-36 rounded-lg overflow-hidden relative flex-shrink-0 bg-slate-900">
                  <img
                    src={trip.cover_image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80'}
                    alt={trip.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/80 text-white">
                    {trip.stop_count || 0} Stops
                  </span>
                </div>

                {/* Trip Overview Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full space-y-2.5">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {trip.title}
                    </h3>
                    {trip.description && (
                      <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                        {trip.description}
                      </p>
                    )}

                    {/* Metadata chips */}
                    <div className="flex flex-wrap gap-3.5 text-xs text-slate-300 mt-2.5">
                      {(trip.start_date || trip.end_date) && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar size={12} className="text-slate-500" />
                          {formatDate(trip.start_date)}{trip.end_date && ` - ${formatDate(trip.end_date)}`}
                        </span>
                      )}
                      {trip.total_budget > 0 && (
                        <span className="flex items-center gap-1 font-mono font-medium text-emerald-400">
                          <DollarSign size={12} />
                          Budget: {trip.currency || 'USD'} {Number(trip.total_budget).toLocaleString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-400">
                        {trip.activity_count || 0} Activities
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2.5 border-t border-slate-800">
                    <Link
                      to={`/public/${trip.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0b0f17] text-slate-200 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors border border-slate-800"
                    >
                      <Eye size={12} /> View Itinerary
                    </Link>

                    <button
                      onClick={() => handleShareWhatsApp(trip)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-medium transition-colors border border-emerald-500/20"
                      title="Share trip via WhatsApp"
                    >
                      WhatsApp
                    </button>

                    <button
                      disabled={copyingId === trip.id}
                      onClick={() => handleCopyTrip(trip.id)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-colors"
                    >
                      {copyingId === trip.id ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Copy size={12} /> Copy Trip
                        </>
                      )}
                    </button>

                    {user?.role === 'admin' && (
                      <button
                        disabled={moderatingId === trip.id}
                        onClick={() => handleModerateUnpublish(trip.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium text-xs border border-rose-500/20 transition-colors disabled:opacity-50"
                        title="Moderate: Remove from community feed"
                      >
                        <Shield size={12} /> {moderatingId === trip.id ? 'Moderating...' : 'Moderate (Unpublish)'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Share Trip Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 size={15} className="text-blue-400" /> Publish Trip to Community
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {userTrips.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs space-y-2">
                <p>You don't have any trips yet.</p>
                <Link to="/trips/new" className="text-blue-400 underline font-medium">Create a trip first</Link>
              </div>
            ) : (
              <form onSubmit={handleShareTrip} className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Select Trip to Publish</label>
                  <select
                    value={selectedUserTripId}
                    onChange={(e) => setSelectedUserTripId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {userTrips.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#111827] text-white">
                        {t.title} ({t.sharing_status})
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Publishing sets this itinerary to <strong>Public</strong>, displaying your route and schedule on the community catalog.
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={sharingLoading}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
                  >
                    {sharingLoading ? 'Publishing...' : 'Publish to Feed'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="px-3.5 py-2 rounded-lg bg-[#1f2937] text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
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
  );
}
