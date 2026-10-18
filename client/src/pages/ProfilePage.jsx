import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Camera, Lock, Trash2, Save, AlertTriangle, MapPin,
  Calendar, Globe, Heart, Compass, Shield, Check, Plus, Phone,
  Eye, CheckCircle2, Layers, Upload, X, ArrowRight
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { compressImageFile } from '../utils/imageCompressor';

const LANGUAGES = [
  { code: 'en', name: 'English (US)' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
];

function fmt(d) {
  if (!d) return 'Dates TBD';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable Profile Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [city, setCity]           = useState('');
  const [country, setCountry]     = useState('');
  const [bio, setBio]             = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarCompressing, setAvatarCompressing] = useState(false);
  const fileInputRef = useRef(null);
  const [language, setLanguage]   = useState('en');
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarCompressing(true);
      const dataUrl = await compressImageFile(file, 256, 256, 0.8);
      setAvatarUrl(dataUrl);
    } catch (err) {
      alert(err.message || 'Failed to process image');
    } finally {
      setAvatarCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Saved destinations
  const [savedDestinations, setSavedDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [removingCityId, setRemovingCityId] = useState(null);

  // Trips
  const [userTrips, setUserTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  // Password fields
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg]         = useState(null);
  const [pwSaving, setPwSaving]   = useState(false);

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSavedDestinations();
    fetchUserTrips();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/profile');
      const u = res.data.data.user;
      setProfile(u);
      setFirstName(u.first_name || (u.name ? u.name.split(' ')[0] : ''));
      setLastName(u.last_name || (u.name ? u.name.split(' ').slice(1).join(' ') : ''));
      setEmail(u.email || '');
      setPhone(u.phone || '');
      setCity(u.city || '');
      setCountry(u.country || '');
      setBio(u.bio || '');
      setAvatarUrl(u.avatar_url || '');
      setLanguage(u.language_preference || 'en');
    } catch (err) {
      console.error('[Profile] fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedDestinations = async () => {
    setLoadingDestinations(true);
    try {
      const res = await api.get('/profile/saved-destinations');
      setSavedDestinations(res.data.data?.destinations || []);
    } catch (err) {
      console.error('[Profile] fetch saved destinations error', err);
    } finally {
      setLoadingDestinations(false);
    }
  };

  const fetchUserTrips = async () => {
    setLoadingTrips(true);
    try {
      const res = await api.get('/trips');
      setUserTrips(res.data.data?.trips || []);
    } catch (err) {
      console.error('[Profile] fetch trips error', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        language_preference: language,
      };

      const res = await api.put('/profile', payload);
      const updated = res.data.data.user;
      setProfile(updated);
      updateUser(updated);
      setProfileMsg({ type: 'success', text: 'Profile details updated successfully.' });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to update profile.';
      setProfileMsg({ type: 'error', text: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRemoveSaved = async (cityId) => {
    setRemovingCityId(cityId);
    try {
      await api.delete(`/profile/saved-destinations/${cityId}`);
      setSavedDestinations((prev) => prev.filter((d) => d.city_id !== cityId));
    } catch (err) {
      console.error('[Profile] remove destination error', err);
      alert('Failed to remove bookmark.');
    } finally {
      setRemovingCityId(null);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/profile/password', { current_password: currentPw, new_password: newPw });
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to change password.';
      setPwMsg({ type: 'error', text: msg });
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/profile');
      logout();
      navigate('/');
    } catch (err) {
      console.error('[Profile] delete error', err);
      alert('Failed to delete account.');
      setDeleting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const preplannedTrips = userTrips.filter((t) => !t.end_date || t.end_date >= todayStr);
  const previousTrips = userTrips.filter((t) => t.end_date && t.end_date < todayStr);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#0b0f17]">
        <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 pb-20 bg-[#0b0f17] text-slate-100">
      <div className="w-full max-w-5xl mx-auto space-y-8 pt-2">

        {/* User Profile Header */}
        <div className="p-6 md:p-8 rounded-xl border border-slate-800 bg-[#111827]">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Left: Avatar with File Upload */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0 mx-auto lg:mx-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-slate-700 group bg-slate-900 cursor-pointer"
                title="Select a local avatar image"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="User Avatar"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-200">
                    <span className="text-3xl font-bold">
                      {firstName ? firstName.charAt(0).toUpperCase() : (profile?.name?.charAt(0) || 'U')}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Camera size={11} /> Photo
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-medium gap-1">
                  <Camera size={18} />
                  <span>{avatarUrl ? 'Change' : 'Upload'}</span>
                </div>
              </div>

              {/* Status and Role Pill */}
              <div className="text-center space-y-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <User size={11} /> {profile?.role === 'admin' ? 'Administrator' : 'Traveler'}
                </span>
                <p className="text-slate-400 text-xs">
                  {userTrips.length} Itinerar{userTrips.length !== 1 ? 'ies' : 'y'}
                </p>
              </div>

              {/* Upload & Remove */}
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarCompressing}
                    className="px-3 py-1.5 rounded-lg bg-[#1f2937] hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Upload size={12} /> {avatarCompressing ? 'Compressing...' : (avatarUrl ? 'Change' : 'Upload')}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors flex items-center gap-1"
                    >
                      <X size={11} /> Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 text-center">Compressed locally in-browser</p>
              </div>
            </div>

            {/* Right: Editable User Details Card */}
            <div className="flex-1 w-full space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h1 className="text-xl font-bold text-white tracking-tight">Profile Details & Settings</h1>
                <p className="text-slate-400 text-xs mt-0.5">
                  Update your contact parameters, location, and travel summary
                </p>
              </div>

              {profileMsg && (
                <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                }`}>
                  {profileMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Morgan"
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0b0f17]/40 border border-slate-800 text-slate-500 text-xs cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 (555) 019-2834"
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">City</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. San Francisco"
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Country</label>
                    <div className="relative">
                      <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. United States"
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Preferred Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-[#111827] text-white">
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">
                    Bio & Travel Style
                  </label>
                  <textarea
                    rows={2.5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief background or preferred travel pacing."
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {profileSaving ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Saved Destinations Section */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#111827] space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Heart size={15} className="text-rose-400 fill-rose-400" />
                Bookmarked Destinations
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cities and regions saved to your travel wishlist
              </p>
            </div>
            <Link
              to="/cities"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Compass size={13} /> Destination Catalog <ArrowRight size={12} />
            </Link>
          </div>

          {loadingDestinations ? (
            <div className="py-6 text-center text-slate-500 text-xs">Loading saved places...</div>
          ) : savedDestinations.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs rounded-lg border border-slate-800 bg-[#0b0f17]">
              No saved destinations yet. Explore cities to build your wishlist.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {savedDestinations.map((dest) => (
                <div
                  key={dest.id}
                  className="rounded-lg overflow-hidden bg-[#0b0f17] border border-slate-800 flex flex-col group"
                >
                  <div className="relative h-24 overflow-hidden bg-slate-900">
                    <img
                      src={dest.image_url || 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=400&q=80'}
                      alt={dest.city_name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                    <button
                      disabled={removingCityId === dest.city_id}
                      onClick={() => handleRemoveSaved(dest.city_id)}
                      className="absolute top-2 right-2 p-1 rounded-md bg-black/70 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors text-xs"
                      title="Remove bookmark"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="absolute bottom-2 left-2.5">
                      <p className="text-white font-bold text-xs">{dest.city_name}</p>
                      <p className="text-slate-400 text-[10px]">{dest.country}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preplanned Trips Section */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#111827] space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Scheduled Itineraries</h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                {preplannedTrips.length}
              </span>
            </div>
            <Link to="/trips/new" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              + Plan New Trip
            </Link>
          </div>

          {loadingTrips ? (
            <div className="py-6 text-center text-slate-500 text-xs">Loading preplanned trips...</div>
          ) : preplannedTrips.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs bg-[#0b0f17] rounded-lg border border-slate-800">
              No upcoming itineraries scheduled. Click "+ Plan New Trip" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {preplannedTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-lg overflow-hidden bg-[#0b0f17] border border-slate-800 flex flex-col justify-between group"
                >
                  <div className="relative h-28 overflow-hidden bg-slate-900">
                    <img
                      src={trip.cover_image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80'}
                      alt={trip.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-semibold">
                        Scheduled
                      </span>
                    </div>
                  </div>

                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-white font-semibold text-xs truncate group-hover:text-blue-400 transition-colors">
                        {trip.title}
                      </h4>
                      <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                        <Calendar size={10} /> {fmt(trip.start_date)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-slate-500 text-[11px]">
                        {trip.stop_count || 0} stops
                      </span>
                      <button
                        onClick={() => navigate(`/trips/${trip.id}/view`)}
                        className="px-2.5 py-1 rounded-md bg-[#1f2937] hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1 transition-colors border border-slate-700"
                      >
                        <Eye size={11} /> View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Previous Trips Section */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#111827] space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Concluded Trips Archive</h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                {previousTrips.length}
              </span>
            </div>
          </div>

          {loadingTrips ? (
            <div className="py-6 text-center text-slate-500 text-xs">Loading concluded trips...</div>
          ) : previousTrips.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs bg-[#0b0f17] rounded-lg border border-slate-800">
              No completed trips in your archive yet. Concluded itineraries will organize here automatically.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {previousTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-lg overflow-hidden bg-[#0b0f17] border border-slate-800 flex flex-col justify-between group"
                >
                  <div className="relative h-28 overflow-hidden bg-slate-900">
                    <img
                      src={trip.cover_image_url || 'https://images.unsplash.com/photo-1539627831859-a911cf04d3cd?auto=format&fit=crop&w=600&q=80'}
                      alt={trip.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                        Completed
                      </span>
                    </div>
                  </div>

                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-white font-semibold text-xs truncate group-hover:text-blue-400 transition-colors">
                        {trip.title}
                      </h4>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {fmt(trip.start_date)} - {fmt(trip.end_date)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-emerald-400 font-mono text-xs font-semibold">
                        ${parseFloat(trip.total_spent || trip.total_budget || 0).toLocaleString()}
                      </span>
                      <button
                        onClick={() => navigate(`/trips/${trip.id}/view`)}
                        className="px-2.5 py-1 rounded-md bg-[#1f2937] hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1 transition-colors border border-slate-700"
                      >
                        <Eye size={11} /> View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & Danger Zone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Password Change */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#111827] space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock size={15} className="text-blue-400" /> Account Password
            </h3>

            {pwMsg && (
              <div className={`p-2.5 rounded-lg text-xs font-medium ${
                pwMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
              }`}>
                {pwMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-2.5">
              <input
                type="password"
                required
                placeholder="Current Password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input
                type="password"
                required
                placeholder="New Password (min 6 chars)"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input
                type="password"
                required
                placeholder="Confirm New Password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                disabled={pwSaving}
                className="w-full py-2 rounded-lg bg-[#1f2937] hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700"
              >
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Delete Account Danger Zone */}
          <div className="p-5 rounded-xl border border-rose-500/20 bg-[#111827] space-y-3">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={15} /> Danger Zone
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Permanently remove your account, trips, checklists, and expense history.
            </p>

            {showDelete ? (
              <div className="space-y-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <p className="text-rose-300 text-xs font-semibold">Confirm account deletion?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500"
                  >
                    {deleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                  <button
                    onClick={() => setShowDelete(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#1f2937] text-slate-300 text-xs font-medium hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDelete(true)}
                className="w-full py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors"
              >
                Delete Account
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
