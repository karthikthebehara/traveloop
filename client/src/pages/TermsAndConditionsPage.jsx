import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function TermsAndConditionsPage() {
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
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Terms and Conditions</h1>
            <p className="text-xs text-slate-400 mt-1">Effective Date: October 18, 2026 | Version 1.0</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-400" /> 1. Acceptance of Terms
          </h2>
          <p>
            By accessing or registering with Traveloop, you agree to be bound by these Terms and Conditions
            and all applicable laws and regulations. If you disagree with any portion of these terms, you are
            prohibited from using this service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-400" /> 2. Account Registration and Security
          </h2>
          <p>
            You must provide accurate and verifiable information when creating an account. You are responsible
            for maintaining the confidentiality of your credentials and for all actions that occur under your account.
            Notify support immediately of any unauthorized account activity.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle size={16} className="text-blue-400" /> 3. Acceptable Use and Community Standards
          </h2>
          <p>
            Users agree not to publish defamatory, abusive, unlawful, or misleading itinerary information.
            Traveloop reserves the right to review and remove content from the Community feed that violates community
            guidelines or disrupts platform integrity.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. User Content and Intellectual Property</h2>
          <p>
            You retain full intellectual property ownership of the itineraries, notes, and custom activities you construct.
            When you publish a trip to the Community feed, you grant Traveloop a non-exclusive license to display the itinerary
            structure to other registered users for copying and personalization.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Service Availability and Modifications</h2>
          <p>
            Traveloop continually improves its planning tools and catalog data. We reserve the right to modify or discontinue
            features with or without prior notice. We do not guarantee uninterrupted or error-free service availability.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Limitation of Liability</h2>
          <p>
            Traveloop provides itinerary scheduling, budget calculation, and packing checklist utilities for planning purposes.
            Travel prices, weather conditions, visa requirements, and transit schedules must be independently verified by the traveler.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
        <span>Traveloop Platform Architecture</span>
        <Link to="/privacy" className="text-blue-400 hover:underline">View Privacy Policy</Link>
      </div>
    </div>
  );
}
