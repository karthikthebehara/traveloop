import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Compass, Shield, FileText, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-base hover:text-blue-400 transition-colors">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
                <Plane size={15} />
              </div>
              <span className="tracking-tight">Traveloop</span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              Multi-city itinerary builder and expense tracker designed for organized travelers worldwide.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <p className="text-white font-semibold text-xs uppercase tracking-wider">Planning Tools</p>
            <ul className="space-y-1.5">
              <li>
                <Link to="/trips" className="hover:text-white transition-colors">My Itineraries</Link>
              </li>
              <li>
                <Link to="/trips/new" className="hover:text-white transition-colors">Create Trip</Link>
              </li>
              <li>
                <Link to="/checklist" className="hover:text-white transition-colors">Packing Checklist</Link>
              </li>
              <li>
                <Link to="/budget" className="hover:text-white transition-colors">Expense Tracker</Link>
              </li>
            </ul>
          </div>

          {/* Exploration */}
          <div className="space-y-2">
            <p className="text-white font-semibold text-xs uppercase tracking-wider">Catalog & Community</p>
            <ul className="space-y-1.5">
              <li>
                <Link to="/cities" className="hover:text-white transition-colors">Destination Catalog</Link>
              </li>
              <li>
                <Link to="/activities" className="hover:text-white transition-colors">Activity Catalog</Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-white transition-colors">Community Feed</Link>
              </li>
              <li>
                <Link to="/notes" className="hover:text-white transition-colors">Travel Journal</Link>
              </li>
            </ul>
          </div>

          {/* Legal and Architecture */}
          <div className="space-y-2">
            <p className="text-white font-semibold text-xs uppercase tracking-wider">Compliance & Legal</p>
            <ul className="space-y-1.5">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                <span className="text-slate-500 font-mono text-[11px]">CORS & Custom Domain Ready</span>
              </li>
              <li>
                <span className="text-slate-500 font-mono text-[11px]">Database: MySQL 8.0</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Traveloop. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link to="/community" className="hover:text-slate-400 transition-colors">Community</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
