import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  DollarSign, TrendingUp, AlertTriangle, Plus, Trash2, Calendar,
  CreditCard, ShieldAlert, ChevronDown, MapPin, X
} from 'lucide-react';

const CATEGORY_COLORS = {
  Transport:  '#0284c7', // Sky Blue
  Stay:       '#2563eb', // Royal Blue
  Activities: '#0d9488', // Teal
  Meals:      '#d97706', // Amber
  Other:      '#64748b', // Slate
};

const CATEGORIES = ['Transport', 'Stay', 'Activities', 'Meals'];

export default function Budget() {
  const location = useLocation();
  const [tripId, setTripId] = useState(null);
  const [trips, setTrips] = useState([]);
  const [tripStops, setTripStops] = useState([]);
  const [budgetData, setBudgetData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Expense Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    category: 'Activities',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    trip_stop_id: '',
    notes: '',
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [deletingExpId, setDeletingExpId] = useState(null);

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
        await loadTripData(activeId);
      } else {
        setError('No trips found. Create a trip first to track your budget.');
        setLoading(false);
      }
    } catch (err) {
      console.error('[Budget] init error', err);
      setError('Failed to fetch trips. Please login again.');
      setLoading(false);
    }
  };

  const loadTripData = async (activeTripId) => {
    try {
      const [budgetRes, expensesRes, stopsRes] = await Promise.all([
        api.get(`/trips/${activeTripId}/budget`),
        api.get(`/trips/${activeTripId}/expenses`),
        api.get(`/trips/${activeTripId}/stops`),
      ]);
      setBudgetData(budgetRes.data.data);
      setExpenses(expensesRes.data.data?.expenses || []);
      setTripStops(stopsRes.data.data?.stops || []);
      setError('');
    } catch (err) {
      console.error('[Budget] loadTripData error', err);
      setError('Failed to load budget data for this trip.');
    } finally {
      setLoading(false);
    }
  };

  const handleTripChange = async (newId) => {
    setTripId(newId);
    setLoading(true);
    await loadTripData(newId);
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSubmittingExpense(true);

    try {
      const payload = {
        category: form.category,
        amount: parseFloat(form.amount),
        expense_date: form.expense_date || undefined,
        trip_stop_id: form.trip_stop_id ? parseInt(form.trip_stop_id, 10) : undefined,
        notes: form.notes?.trim() || undefined,
      };

      await api.post(`/trips/${tripId}/expenses`, payload);
      setShowAddModal(false);
      setForm({
        category: 'Activities',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        trip_stop_id: '',
        notes: '',
      });
      await loadTripData(tripId);
    } catch (err) {
      console.error('[Budget] create expense error', err);
      alert('Failed to log expense. Please check your inputs.');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (expId) => {
    if (!confirm('Delete this logged expense?')) return;
    setDeletingExpId(expId);
    try {
      await api.delete(`/trips/${tripId}/expenses/${expId}`);
      await loadTripData(tripId);
    } catch (err) {
      console.error('[Budget] delete expense error', err);
      alert('Failed to delete expense.');
    } finally {
      setDeletingExpId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#0b0f17]">
        <div className="p-8 text-center rounded-xl border border-slate-800 bg-[#111827]">
          <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-300 text-xs font-semibold">Calculating real-time budget analytics...</p>
        </div>
      </div>
    );
  }

  if (!loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6 bg-[#0b0f17]">
        <div className="p-10 text-center max-w-md w-full rounded-xl border border-slate-800 bg-[#111827] space-y-3">
          <div className="w-12 h-12 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center mx-auto">
            <DollarSign size={24} />
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
  const currency = budgetData?.currency || selectedTrip?.currency || 'USD';
  const totalBudget = budgetData?.total_budget || 0;
  const totalSpent = budgetData?.total_spent || 0;
  const remaining = budgetData?.remaining || 0;
  const isOverBudget = budgetData?.over_budget || false;
  const avgCostPerDay = budgetData?.average_cost_per_day || 0;
  const dailyThreshold = budgetData?.daily_budget_threshold || 0;
  const overBudgetDays = budgetData?.over_budget_days || [];
  const byCategory = budgetData?.by_category || [];
  const byDay = budgetData?.by_day || [];

  return (
    <div className="w-full px-4 md:px-8 pb-20 bg-[#0b0f17] text-slate-100">
      <div className="w-full max-w-7xl mx-auto space-y-6 pt-2">

        {/* Top Header Glass Banner */}
        <div className="p-6 md:p-8 rounded-xl border border-slate-800 bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1 block">
              Financial Tracking & Cost Variance
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Trip Budget & Spending
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Category tracking across Transport, Stay, Activities, and Meals with daily threshold limits.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {trips.length > 0 && (
              <div className="relative">
                <select
                  value={tripId || ''}
                  onChange={(e) => handleTripChange(parseInt(e.target.value, 10))}
                  className="w-full sm:w-60 pl-3 pr-8 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
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
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors flex-shrink-0"
            >
              <Plus size={14} /> Log Expense
            </button>
          </div>
        </div>

        {/* Over Budget Alert Banner */}
        {isOverBudget && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-white">Trip is Over Allocated Budget</h3>
              <p className="text-xs text-red-300 mt-0.5">
                Total spending has exceeded your target budget by{' '}
                <strong className="text-white">
                  {currency} {Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>.
              </p>
            </div>
          </div>
        )}

        {/* Daily Threshold Warning Banner */}
        {overBudgetDays.length > 0 && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-white">
                Daily Budget Threshold Exceeded on {overBudgetDays.length} Day{overBudgetDays.length !== 1 ? 's' : ''}
              </h3>
              <p className="text-xs text-amber-300 mt-0.5">
                Daily alert threshold is set to <strong className="text-white">{currency} {dailyThreshold.toLocaleString()}</strong> / day.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {overBudgetDays.map((d) => (
                  <span key={d.date} className="px-2 py-0.5 rounded-md bg-[#0b0f17] text-amber-300 text-xs font-mono border border-amber-500/30">
                    {d.date}: {currency} {d.total.toFixed(0)} (+{(d.total - dailyThreshold).toFixed(0)})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-lg border border-slate-800 bg-[#111827]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Budget
            </span>
            <p className="text-2xl font-bold text-white">
              {totalBudget > 0 ? (
                <>{currency} {totalBudget.toLocaleString()}</>
              ) : (
                <span className="text-slate-500 text-lg font-normal">Not configured</span>
              )}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">
              Trip spending target
            </span>
          </div>

          <div className="p-5 rounded-lg border border-slate-800 bg-[#111827]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Spent
            </span>
            <p className="text-2xl font-bold text-slate-100">
              {currency} {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">
              {totalBudget > 0 ? `${budgetData?.pct_used || 0}% of budget utilized` : 'All expenses & activities'}
            </span>
          </div>

          <div className={`p-5 rounded-lg border bg-[#111827] ${isOverBudget ? 'border-red-500/40' : 'border-slate-800'}`}>
            <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
              {isOverBudget ? 'Budget Deficit' : 'Remaining Balance'}
            </span>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
              {currency} {Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">
              {isOverBudget ? 'Exceeding budget limit' : 'Available for remaining itinerary'}
            </span>
          </div>

          <div className="p-5 rounded-lg border border-slate-800 bg-[#111827]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Avg Cost / Day
            </span>
            <p className="text-2xl font-bold text-blue-400">
              {currency} {avgCostPerDay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">
              {dailyThreshold > 0 ? `Alert limit: ${currency} ${dailyThreshold}/day` : `${budgetData?.days_count || 1} trip day(s)`}
            </span>
          </div>
        </div>

        {/* 2 Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Category Breakdown */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#111827] flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={15} className="text-blue-400" />
                Category Breakdown (4 Pillars)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Transport, Stay, Activities, and Meals</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {byCategory.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => `${currency} ${Number(val).toLocaleString()}`}
                    contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800">
              {byCategory.map((c) => (
                <div key={c.category} className="p-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">{c.category}</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {currency} {c.total.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Daily Spending Timeline */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#111827] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={15} className="text-emerald-400" />
                  Daily Spending Timeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Daily recorded spend vs alert threshold</p>
              </div>
              {dailyThreshold > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
                  Limit: {currency} {dailyThreshold}
                </span>
              )}
            </div>

            <div className="h-64 w-full">
              {byDay.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Calendar size={28} className="opacity-40 mb-2" />
                  <p>No dated expenses or activities logged yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.6} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.slice(5)} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      formatter={(val) => [`${currency} ${Number(val).toLocaleString()}`, 'Spent']}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#2563eb">
                      {byDay.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.is_over_budget ? '#ef4444' : '#2563eb'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
              <span>{byDay.length} calendar date(s)</span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> Normal
                <span className="w-2 h-2 rounded-full bg-red-500 ml-2" /> Over Threshold
              </span>
            </div>
          </div>
        </div>

        {/* Logged Expenses Table */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#111827]">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={15} className="text-emerald-400" /> Logged Trip Expenses
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Receipts and payments logged directly for this itinerary
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 text-xs font-medium transition-colors w-fit"
            >
              <Plus size={13} /> Add Receipt / Expense
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-800 bg-[#0b0f17] text-slate-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">City Stop</th>
                  <th className="p-3.5">Notes / Description</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                      No standalone receipts recorded yet. Click "Log Expense" to track hotels, transit, meals, or activities.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[exp.category] || '#64748b'}20`,
                            color: CATEGORY_COLORS[exp.category] || '#94a3b8',
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {exp.city_name ? exp.city_name : '-'}
                      </td>
                      <td className="p-3.5 text-slate-200">
                        {exp.notes || '-'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-white">
                        {currency} {parseFloat(exp.amount).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          disabled={deletingExpId === exp.id}
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 rounded text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-50"
                          title="Delete expense"
                        >
                          {deletingExpId === exp.id ? (
                            <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={14} className="text-blue-400" /> Log Expense Record
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#111827] text-white">{c}</option>
                  ))}
                  <option value="Other" className="bg-[#111827] text-white">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Amount ({currency}) *</label>
                <div className="relative">
                  <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={form.expense_date}
                    onChange={(e) => setForm((p) => ({ ...p, expense_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">City Stop (Optional)</label>
                  <select
                    value={form.trip_stop_id}
                    onChange={(e) => setForm((p) => ({ ...p, trip_stop_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="" className="bg-[#111827] text-white">General Trip</option>
                    {tripStops.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#111827] text-white">{s.city_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Hotel reservation deposit or Airport transfer"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingExpense || !form.amount}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  {submittingExpense ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Record Expense'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-[#1f2937] text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
