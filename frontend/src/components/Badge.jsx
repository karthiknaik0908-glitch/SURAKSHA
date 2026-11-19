import React from 'react';

export default function Badge({ status, type = 'status' }) {
  const statusColors = {
    // Priorities
    critical: 'bg-red-950/80 text-red-300 border border-red-700 shadow-sm shadow-red-900/40',
    high: 'bg-orange-950/70 text-orange-400 border border-orange-800',
    medium: 'bg-yellow-950/60 text-yellow-400 border border-yellow-800',
    low: 'bg-green-950/60 text-green-400 border border-green-800',

    // SOS & Rescue Status
    pending: 'bg-amber-950/70 text-amber-400 border border-amber-800 animate-pulse',
    assigned: 'bg-blue-950/70 text-blue-400 border border-blue-800',
    in_progress: 'bg-orange-950/80 text-orange-300 border border-orange-700',
    rescued: 'bg-emerald-950/80 text-emerald-300 border border-emerald-700',

    // Team Status
    available: 'bg-green-950/60 text-green-400 border border-green-800',
    deployed: 'bg-blue-950/60 text-blue-400 border border-blue-800',
    off_duty: 'bg-gray-900 text-gray-400 border border-gray-700',

    // Alert Sources
    risk_assessment: 'bg-purple-950/70 text-purple-300 border border-purple-800',
    user_reported: 'bg-cyan-950/70 text-cyan-300 border border-cyan-800',
    official_alert: 'bg-emerald-950/80 text-emerald-300 border border-emerald-600 font-semibold',

    // Disasters
    flood: 'bg-blue-950/70 text-blue-300 border border-blue-800',
    landslide: 'bg-amber-950/70 text-amber-300 border border-amber-800',
    earthquake: 'bg-purple-950/70 text-purple-300 border border-purple-800',
    cyclone: 'bg-teal-950/70 text-teal-300 border border-teal-800',
    forest_fire: 'bg-rose-950/70 text-rose-300 border border-rose-800',
    cloudburst: 'bg-indigo-950/70 text-indigo-300 border border-indigo-800',
  };

  const key = String(status || '').toLowerCase().replace(/-/g, '_');
  const cls = statusColors[key] || 'bg-gray-900 text-gray-400 border border-gray-700';
  const label = String(status || '').replace(/_/g, ' ').toUpperCase();

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide ${cls}`}>
      {label}
    </span>
  );
}
