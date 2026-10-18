import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, FileText, CheckCircle, Database } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full px-4 md:px-8 py-10 max-w-4xl mx-auto space-y-8 text-slate-300">
      <div className="border-b border-slate-800 pb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to Traveloop
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-slate-400 mt-1">Effective Date: October 18, 2026 | Version 1.0</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={16} className="text-blue-400" /> 1. Overview and Scope
          </h2>
          <p>
            Traveloop operates a multi-city itinerary planner and travel expense management application.
            This Privacy Policy describes how we collect, store, process, and protect your personal data when you
            create an account, construct itineraries, manage packing checklists, or publish journeys to the community.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database size={16} className="text-blue-400" /> 2. Information We Collect
          </h2>
          <div className="space-y-2">
            <p><strong className="text-white">Account Details:</strong> When you register, we collect your first name, last name, email address, optional contact phone number, home city, country, and travel preferences bio.</p>
            <p><strong className="text-white">Itinerary and Financial Data:</strong> We store itinerary titles, destination cities, start and end dates, scheduled activities, category-based expense budgets, and packing checklist states.</p>
            <p><strong className="text-white">Profile Avatars:</strong> Profile images selected from your device are processed and resized locally via client-side HTML5 canvas compression. Compressed image data is stored securely in your database record without external third-party scraping.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock size={16} className="text-blue-400" /> 3. Data Storage and Security
          </h2>
          <p>
            All user authentication passwords are encrypted using industry-standard bcrypt hashing prior to database persistence.
            API communication is enforced through HTTPS and authenticated via JSON Web Tokens (JWT). Access to administrative
            features is strictly restricted to verified system administrators.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-blue-400" /> 4. Public Sharing and Community Itineraries
          </h2>
          <p>
            By default, all created itineraries, stops, notes, and budgets are private to your user account.
            If you explicitly toggle an itinerary's visibility to "Public" or share it to the Traveloop Community,
            the trip title, destination stops, scheduled activities, and creator display name become publicly readable
            by other members. You retain the ability to revert any trip to "Private" at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. User Rights and Data Deletion</h2>
          <p>
            You have full ownership and control over your personal data. You may update your profile details, edit or delete
            individual trips, or permanently remove your entire account and associated records directly from your Account
            Settings page.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Contact Information</h2>
          <p>
            If you have questions regarding this Privacy Policy or your account data, contact the platform team at{' '}
            <span className="text-blue-400 font-mono">support@traveloop.com</span>.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
        <span>Traveloop Platform Architecture</span>
        <Link to="/terms" className="text-blue-400 hover:underline">View Terms and Conditions</Link>
      </div>
    </div>
  );
}
