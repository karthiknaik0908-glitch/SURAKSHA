import React from 'react';

export default function StatCard({ title, value, icon, color = 'red', subtitle, loading }) {
  const colorMap = {
    red: 'border-red-900/60 bg-gradient-to-br from-red-950/40 to-[#1e1e1e]',
    green: 'border-green-900/60 bg-gradient-to-br from-green-950/40 to-[#1e1e1e]',
    blue: 'border-blue-900/60 bg-gradient-to-br from-blue-950/40 to-[#1e1e1e]',
    orange: 'border-orange-900/60 bg-gradient-to-br from-orange-950/40 to-[#1e1e1e]',
    purple: 'border-purple-900/60 bg-gradient-to-br from-purple-950/40 to-[#1e1e1e]',
    yellow: 'border-yellow-900/60 bg-gradient-to-br from-yellow-950/40 to-[#1e1e1e]',
  };

  const textColorMap = {
    red: 'text-red-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-5 shadow-lg backdrop-blur-sm ${colorMap[color] || colorMap.red} transition-transform hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 truncate">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-[#2a2a2a] rounded animate-pulse" />
          ) : (
            <p className={`text-2xl sm:text-3xl font-extrabold ${textColorMap[color] || textColorMap.red}`}>{value}</p>
          )}
          {subtitle && <p className="text-gray-500 text-xs mt-1 truncate">{subtitle}</p>}
        </div>
        <div className="text-2xl sm:text-3xl p-2 bg-black/40 rounded-lg flex-shrink-0">{icon}</div>
      </div>
    </div>
  );
}
