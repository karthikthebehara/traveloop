import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Map, CheckSquare, DollarSign, ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: Map,
    title: 'Multi-City Route Planning',
    desc: 'Sequence destinations chronologically with arrival and departure dates and transit notes.',
  },
  {
    icon: DollarSign,
    title: 'Expense & Budget Tracker',
    desc: 'Record categorized expenditures against target budgets with real-time variance calculations.',
  },
  {
    icon: CheckSquare,
    title: 'Structured Packing Lists',
    desc: 'Organize trip gear by category with completion counters to ensure departure readiness.',
  },
  {
    icon: Globe,
    title: 'Public Link Sharing',
    desc: 'Publish read-only trip itineraries with interactive maps and complete daily schedules.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [dbOk, setDbOk] = useState(null);

  // Redirect logged in users according to role
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Prove the API connection is live
  useEffect(() => {
    api
      .get('/../../')
      .then((r) => setDbOk(r.data?.db_test === 2))
      .catch(() => setDbOk(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100">
      {/* ── Top Bar ── */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-800/80 bg-[#0e1422]">
        <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Compass size={18} />
          </div>
          <span>Traveloop</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white transition-colors text-xs font-semibold"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            Create Account <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-blue-400 text-xs font-medium mb-6">
          <ShieldCheck size={14} />
          <span>Production Travel Coordination Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight mb-6">
          Multi-City Itinerary Builder & Trip Expense Tracker
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mb-8 leading-relaxed">
          Coordinate multi-stop travel routes, schedule verified sightseeing activities, balance budgets with live
          expense tracking, and generate packing checklists.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-sm transition-colors"
          >
            Start Planning Trip <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/community')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#1f2937] hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors"
          >
            Explore Public Itineraries
          </button>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-6 pb-20 max-w-6xl mx-auto w-full">
        <div className="border-t border-slate-800 pt-12">
          <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-6 text-center">
            Core Planning Modules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/80 text-blue-400 flex items-center justify-center mb-3.5">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-sm text-white mb-1.5">{title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
