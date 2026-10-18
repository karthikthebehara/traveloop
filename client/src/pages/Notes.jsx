import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen, Plus, Trash2, Edit3, Save, X, Calendar, ChevronDown,
  MapPin, Search, AlertTriangle
} from 'lucide-react';
import api from '../api/axios';

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDateOnly(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NotesPage() {
  const location = useLocation();
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [stops, setStops] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [stopFilter, setStopFilter] = useState('all');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tripStopId, setTripStopId] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      fetchTripDetails(selectedTripId);
    }
  }, [selectedTripId]);

  const fetchTrips = async () => {
    setLoadingTrips(true);
    try {
      const res = await api.get('/trips');
      const fetchedTrips = res.data.data?.trips || [];
      setTrips(fetchedTrips);

      if (fetchedTrips.length > 0) {
        const searchParams = new URLSearchParams(location.search);
        const queryTripId = searchParams.get('tripId');
        const activeId = queryTripId ? parseInt(queryTripId, 10) : fetchedTrips[0].id;
        setSelectedTripId(activeId);
      }
    } catch (err) {
      console.error('[Notes] fetch trips error', err);
      setError('Failed to load trips.');
    } finally {
      setLoadingTrips(false);
    }
  };

  const fetchTripDetails = async (tripId) => {
    setLoadingNotes(true);
    try {
      const [notesRes, stopsRes] = await Promise.all([
        api.get(`/trips/${tripId}/notes`),
        api.get(`/trips/${tripId}/stops`),
      ]);
      setNotes(notesRes.data.data?.notes || []);
      setStops(stopsRes.data.data?.stops || []);
      setError('');
    } catch (err) {
      console.error('[Notes] fetch notes error', err);
      setError('Failed to load notes for this trip.');
    } finally {
      setLoadingNotes(false);
    }
  };

  const openForm = (note = null) => {
    setEditingNote(note);
    setTitle(note ? note.title || '' : '');
    setContent(note ? note.content || '' : '');
    setTripStopId(note?.trip_stop_id ? note.trip_stop_id.toString() : '');
    setNoteDate(note?.note_date ? note.note_date.split('T')[0] : '');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setTripStopId('');
    setNoteDate('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim() || undefined,
        content: content.trim(),
        trip_stop_id: tripStopId ? parseInt(tripStopId, 10) : null,
        note_date: noteDate || null,
      };

      if (editingNote) {
        const res = await api.put(`/trips/${selectedTripId}/notes/${editingNote.id}`, payload);
        const updated = res.data.data.note;
        setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? updated : n)));
      } else {
        const res = await api.post(`/trips/${selectedTripId}/notes`, payload);
        const added = res.data.data.note;
        setNotes((prev) => [added, ...prev]);
      }
      closeForm();
    } catch (err) {
      console.error('[Notes] save error', err);
      setError('Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/trips/${selectedTripId}/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (editingNote?.id === noteId) closeForm();
    } catch (err) {
      console.error('[Notes] delete error', err);
      setError('Failed to delete note.');
    }
  };

  if (loadingTrips) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#0b0f17]">
        <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#0b0f17] px-6">
        <div className="p-10 text-center rounded-xl border border-slate-800 bg-[#111827] max-w-md space-y-3">
          <div className="w-12 h-12 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center mx-auto">
            <BookOpen size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">No Trips Yet</h2>
          <p className="text-slate-400 text-xs">Create a trip first to maintain notes and journal entries.</p>
          <button
            onClick={() => (window.location.href = '/trips/new')}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors w-full"
          >
            Create New Trip
          </button>
        </div>
      </div>
    );
  }

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  const filteredNotes = notes.filter((n) => {
    if (stopFilter !== 'all') {
      if (stopFilter === 'none' && n.trip_stop_id) return false;
      if (stopFilter !== 'none' && n.trip_stop_id?.toString() !== stopFilter) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchContent = n.content?.toLowerCase().includes(q);
      const matchCity = n.city_name?.toLowerCase().includes(q);
      return matchTitle || matchContent || matchCity;
    }
    return true;
  });

  if (!loadingTrips && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6 bg-[#0b0f17]">
        <div className="p-10 text-center max-w-md w-full rounded-xl border border-slate-800 bg-[#111827] space-y-3">
          <div className="w-12 h-12 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center mx-auto">
            <BookOpen size={24} />
          </div>
          <h2 className="text-white font-bold text-lg">No Active Trips Found</h2>
          <p className="text-slate-400 text-xs">Create a trip first to document itineraries, bookings, and logistical notes.</p>
          <button
            onClick={() => (window.location.href = '/trips/new')}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors w-full cursor-pointer"
          >
            Create New Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 pb-20 bg-[#0b0f17] text-slate-100">
      <div className="w-full max-w-6xl mx-auto space-y-6 pt-2">

        {/* Header */}
        <div className="p-6 md:p-8 rounded-xl border border-slate-800 bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Trip Notes & Documentation</h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Maintain logistical instructions, booking references, and recommendations tagged to stops.
              </p>
            </div>
          </div>

          {/* Trip Selector */}
          <div className="relative w-full md:w-60">
            <select
              value={selectedTripId || ''}
              onChange={(e) => setSelectedTripId(parseInt(e.target.value, 10))}
              className="w-full pl-3 pr-8 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#111827] text-white">
                  {t.title}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes by keyword or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#111827] border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <select
              value={stopFilter}
              onChange={(e) => setStopFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#111827] border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all" className="bg-[#111827]">All Stops ({notes.length})</option>
              <option value="none" className="bg-[#111827]">General (No Stop)</option>
              {stops.map((s) => (
                <option key={s.id} value={s.id.toString()} className="bg-[#111827]">
                  {s.city_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => openForm()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors flex-shrink-0"
          >
            <Plus size={14} /> New Note
          </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left Column: Notes List */}
          <div className="lg:col-span-1 space-y-2.5">
            {loadingNotes ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                <div className="w-5 h-5 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                Loading notes...
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs rounded-xl border border-slate-800 bg-[#111827] space-y-2">
                <BookOpen size={24} className="mx-auto opacity-40 text-slate-400" />
                <p className="font-semibold text-slate-300">No notes found</p>
                <p className="text-[11px]">Click "New Note" to record details or travel memories.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredNotes.map((note) => {
                  const isSelected = editingNote?.id === note.id;
                  return (
                    <div
                      key={note.id}
                      onClick={() => openForm(note)}
                      className={`p-3.5 rounded-lg cursor-pointer transition-colors border ${
                        isSelected
                          ? 'border-blue-500 bg-[#111827]'
                          : 'border-slate-800 hover:border-slate-700 bg-[#111827]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-white font-semibold text-xs truncate">
                          {note.title || 'Untitled Note'}
                        </h3>
                        {note.city_name && (
                          <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-[#0b0f17] text-slate-300 border border-slate-800">
                            {note.city_name}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-400 text-xs line-clamp-2 mb-2 leading-relaxed">
                        {note.content}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        {note.note_date ? (
                          <span className="text-slate-400 font-medium">
                            {fmtDateOnly(note.note_date)}
                          </span>
                        ) : (
                          <span>{fmt(note.created_at)}</span>
                        )}
                        <span>{note.content.length} chars</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Note Editor or Empty View */}
          <div className="lg:col-span-2">
            {showForm ? (
              <form
                onSubmit={handleSave}
                className="p-5 md:p-6 rounded-xl border border-slate-800 bg-[#111827] flex flex-col h-full min-h-[480px] space-y-3.5"
              >
                {/* Editor Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2 flex-1 mr-4">
                    <input
                      type="text"
                      placeholder="Note Title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-transparent border-none text-base font-bold text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editingNote && (
                      <button
                        type="button"
                        onClick={() => handleDelete(editingNote.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeForm}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Close Editor"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Tags Bar: City Stop & Specific Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <label className="text-slate-400 text-xs font-medium flex items-center gap-1 flex-shrink-0">
                      <MapPin size={12} className="text-blue-400" /> City Stop:
                    </label>
                    <select
                      value={tripStopId}
                      onChange={(e) => setTripStopId(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="" className="bg-[#111827]">Trip General (No specific stop)</option>
                      {stops.map((s) => (
                        <option key={s.id} value={s.id.toString()} className="bg-[#111827]">
                          {s.city_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-slate-400 text-xs font-medium flex items-center gap-1 flex-shrink-0">
                      <Calendar size={12} className="text-slate-400" /> Target Date:
                    </label>
                    <input
                      type="date"
                      value={noteDate}
                      onChange={(e) => setNoteDate(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Text Area */}
                <textarea
                  required
                  placeholder="Record addresses, packing reminders, recommendations, or journal notes..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full bg-transparent border-none text-slate-200 placeholder-slate-600 focus:outline-none resize-none text-xs leading-relaxed p-1"
                  autoFocus
                />

                {/* Editor Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="text-xs text-slate-500 font-mono">
                    {content.trim().length > 0 ? content.trim().split(/\s+/).length : 0} words | {content.length} chars
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1f2937] text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !content.trim()}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save size={13} /> {editingNote ? 'Update Note' : 'Save Note'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-12 rounded-xl flex flex-col items-center justify-center h-full min-h-[480px] text-center border border-slate-800 bg-[#111827] space-y-2.5">
                <BookOpen size={36} className="text-slate-600" />
                <h3 className="text-sm font-bold text-white">Select a Note or Create One</h3>
                <p className="text-slate-400 text-xs max-w-sm">
                  Select any note from the left to edit its details, or create a new entry.
                </p>
                <button
                  onClick={() => openForm()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors mt-2"
                >
                  <Plus size={14} /> Create New Note
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
