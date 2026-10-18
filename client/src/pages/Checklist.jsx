import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import {
  CheckSquare, Plus, Trash2, RotateCcw, Check,
  ChevronDown, Luggage, ShieldCheck, Tag, Key, Shirt,
  Droplets, FileText, Cpu, Package
} from 'lucide-react';

const CATEGORIES = ['Essentials', 'Clothes', 'Toiletries', 'Documents', 'Electronics', 'General'];

const CategoryIcon = ({ category, size = 15, className = '' }) => {
  switch (category) {
    case 'Essentials':
      return <Key size={size} className={className || 'text-amber-400'} />;
    case 'Clothes':
      return <Shirt size={size} className={className || 'text-blue-400'} />;
    case 'Toiletries':
      return <Droplets size={size} className={className || 'text-cyan-400'} />;
    case 'Documents':
      return <FileText size={size} className={className || 'text-emerald-400'} />;
    case 'Electronics':
      return <Cpu size={size} className={className || 'text-blue-400'} />;
    default:
      return <Package size={size} className={className || 'text-slate-400'} />;
  }
};

export default function Checklist() {
  const location = useLocation();
  const [tripId, setTripId] = useState(null);
  const [trips, setTrips] = useState([]);
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newCategory, setNewCategory] = useState('Essentials');
  const [newQuantity, setNewQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    initTrips();
  }, []);

  const initTrips = async () => {
    setLoading(true);
    try {
      const tripsRes = await api.get('/trips');
      const fetchedTrips = tripsRes.data.data?.trips || [];
      setTrips(fetchedTrips);

      if (fetchedTrips.length > 0) {
        const searchParams = new URLSearchParams(location.search);
        const queryTripId = searchParams.get('tripId');
        const activeId = queryTripId ? parseInt(queryTripId, 10) : fetchedTrips[0].id;
        setTripId(activeId);
        await fetchItems(activeId);
      } else {
        setError('No trips found. Create a trip first to manage packing checklists.');
        setLoading(false);
      }
    } catch (err) {
      console.error('[Checklist] init error', err);
      setError('Failed to fetch trips. Please login again.');
      setLoading(false);
    }
  };

  const fetchItems = async (activeTripId) => {
    try {
      const res = await api.get(`/trips/${activeTripId}/checklist`);
      setItems(res.data.data ? res.data.data.items : res.data);
      setError('');
    } catch (err) {
      console.error('[Checklist] fetchItems error', err);
      setError('Failed to load packing items for this trip.');
    } finally {
      setLoading(false);
    }
  };

  const handleTripChange = async (newId) => {
    setTripId(newId);
    setLoading(true);
    await fetchItems(newId);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setAdding(true);
    try {
      const res = await api.post(`/trips/${tripId}/checklist`, {
        item_name: newItemName.trim(),
        category: newCategory,
        quantity: parseInt(newQuantity, 10) || 1,
      });
      const addedItem = res.data.data ? res.data.data.item : res.data;
      setItems((prev) => [...prev, addedItem]);
      setNewItemName('');
      setNewQuantity(1);
    } catch (err) {
      console.error('[Checklist] add item error', err);
      alert('Failed to add item to checklist.');
    } finally {
      setAdding(false);
    }
  };

  const togglePacked = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_packed: newStatus } : item)));
    try {
      await api.patch(`/trips/${tripId}/checklist/${id}`, { is_packed: newStatus });
    } catch (err) {
      console.error('[Checklist] toggle status error', err);
      fetchItems(tripId);
    }
  };

  const handleDelete = async (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await api.delete(`/trips/${tripId}/checklist/${id}`);
    } catch (err) {
      console.error('[Checklist] delete item error', err);
      fetchItems(tripId);
    }
  };

  const handleResetChecklist = async () => {
    if (!confirm('Reset all checklist items to unpacked for this trip?')) return;
    setResetting(true);
    try {
      await api.patch(`/trips/${tripId}/checklist/reset`);
      setItems((prev) => prev.map((item) => ({ ...item, is_packed: 0 })));
    } catch (err) {
      console.error('[Checklist] reset error', err);
      alert('Failed to reset checklist.');
    } finally {
      setResetting(false);
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const totalItems = items.length;
  const packedItems = items.filter((item) => item.is_packed === 1).length;
  const progressPercent = totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#0b0f17]">
        <div className="p-8 text-center rounded-xl border border-slate-800 bg-[#111827]">
          <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-300 text-xs font-semibold">Loading packing checklist...</p>
        </div>
      </div>
    );
  }

  if (!loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6 bg-[#0b0f17]">
        <div className="p-10 text-center max-w-md w-full rounded-xl border border-slate-800 bg-[#111827] space-y-3">
          <div className="w-12 h-12 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center mx-auto">
            <Luggage size={24} />
          </div>
          <h2 className="text-white font-bold text-lg">No Active Trips Found</h2>
          <p className="text-slate-400 text-xs">{error}</p>
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

  const selectedTrip = trips.find((t) => t.id === tripId);

  return (
    <div className="w-full px-4 md:px-8 pb-20 bg-[#0b0f17] text-slate-100">
      <div className="w-full max-w-4xl mx-auto space-y-6 pt-2">

        {/* Top Header Card */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#111827]">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1 block">
                  Equipment & Gear Checklist
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Packing Checklist
                </h1>
                <p className="text-slate-400 text-xs md:text-sm mt-1">
                  {selectedTrip?.title ? `Checklist for: ${selectedTrip.title}` : 'Structured gear inventory.'}
                </p>
              </div>

              {/* Trip Selector & Reset Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {trips.length > 0 && (
                  <div className="relative">
                    <select
                      value={tripId || ''}
                      onChange={(e) => handleTripChange(parseInt(e.target.value, 10))}
                      className="w-full sm:w-56 pl-3 pr-8 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {trips.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#111827] text-white">
                          {t.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                )}

                <button
                  disabled={resetting || items.length === 0}
                  onClick={handleResetChecklist}
                  title="Uncheck all items"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1f2937] hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  <RotateCcw size={13} className={resetting ? 'animate-spin' : ''} />
                  Reset
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-5 pt-5 border-t border-slate-800">
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Luggage size={14} className="text-blue-400" /> Packing Completion
                </span>
                <span>
                  {progressPercent}% Complete ({packedItems} of {totalItems} items packed)
                </span>
              </div>
              <div className="h-2 w-full bg-[#0b0f17] rounded-sm overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-sm transition-all duration-500 ${
                    progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {progressPercent === 100 && totalItems > 0 && (
                <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center flex items-center justify-center gap-2 text-emerald-300 font-semibold text-xs">
                  <Check size={14} />
                  <span>All items packed and verified for departure.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Item Form */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#111827]">
          <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <input
                type="text"
                required
                placeholder="Item name (e.g. Passport, Power adapter, Walking shoes)..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#111827] text-white">
                    {cat}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                max="99"
                title="Quantity"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="w-14 px-2 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs font-semibold text-center focus:outline-none focus:border-blue-500 transition-colors"
              />

              <button
                type="submit"
                disabled={adding || !newItemName.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                {adding ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={14} /> Add Item
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Grouped Checklist */}
        {Object.keys(groupedItems).length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-slate-800 bg-[#111827] space-y-2">
            <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Luggage size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">No items in packing list</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Use the form above to add items categorized by essentials, clothes, toiletries, electronics, and documents.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, catItems]) => {
              const catPacked = catItems.filter((i) => i.is_packed === 1).length;
              return (
                <div key={category} className="rounded-xl p-5 border border-slate-800 bg-[#111827]">
                  {/* Category Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <CategoryIcon category={category} size={15} />
                      <span>{category}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#0b0f17] text-slate-400 font-mono border border-slate-800">
                        {catPacked} / {catItems.length}
                      </span>
                    </h3>
                  </div>

                  {/* Category Items */}
                  <div className="space-y-1.5">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg transition-colors border ${
                          item.is_packed
                            ? 'bg-[#0b0f17]/50 border-slate-800 text-slate-500'
                            : 'bg-[#0b0f17] border-slate-800 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        <label
                          onClick={() => togglePacked(item.id, item.is_packed)}
                          className="flex items-center gap-2.5 cursor-pointer flex-1 select-none"
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              item.is_packed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-600 hover:border-blue-400'
                            }`}
                          >
                            {item.is_packed === 1 && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className={`text-xs font-medium ${item.is_packed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {item.item_name}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300 font-mono">
                              x{item.quantity}
                            </span>
                          )}
                        </label>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
