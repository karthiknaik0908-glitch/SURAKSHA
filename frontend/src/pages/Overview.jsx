import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const DISASTER_ICONS = {
  flood: '🌊',
  landslide: '⛰️',
  earthquake: '🏚️',
  cyclone: '🌀',
  forest_fire: '🔥',
  cloudburst: '⛈️',
};

export default function Overview() {
  const { tr } = useApp();
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, alertsRes] = await Promise.all([
        apiService.fetchStats(),
        apiService.fetchAlerts(),
      ]);
      setStats(statsRes.data);
      setRecentAlerts((alertsRes.data || []).slice(-3).reverse());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 20000);
    return () => clearInterval(interval);
  }, []);

  const pieData = stats
    ? [
        { name: 'Critical', value: stats.critical_emergencies || 0, color: '#dc2626' },
        { name: 'Pending', value: stats.pending_sos || 0, color: '#f59e0b' },
        { name: 'In Progress', value: stats.in_progress_sos || 0, color: '#3b82f6' },
        {
          name: 'Rescued',
          value: Math.max(
            0,
            (stats.total_sos || 0) -
              (stats.critical_emergencies || 0) -
              (stats.pending_sos || 0) -
              (stats.in_progress_sos || 0)
          ),
          color: '#10b981',
        },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {tr('appName')} Command Center
            </h1>
            <span className="bg-red-950/80 text-red-400 border border-red-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              LIVE
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">{tr('tagline')}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/emergency-sos"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-red-900/50 flex items-center gap-2"
          >
            <span>🆘</span>
            <span>{tr('sos.submit')}</span>
          </Link>
          <Link
            to="/live-rescue-map"
            className="bg-[#1e1e1e] hover:bg-[#282828] border border-[#333333] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          >
            <span>🗺️</span>
            <span>{tr('nav.liveRescueMap')}</span>
          </Link>
          <button
            onClick={loadDashboard}
            className="p-2.5 bg-[#1e1e1e] hover:bg-[#282828] border border-[#333333] text-gray-300 hover:text-white rounded-lg text-sm transition-all"
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-red-300 text-sm flex items-center justify-between">
          <span>⚠️ {error}. Displaying local demo state. Ensure backend server is running on port 8000.</span>
          <button onClick={loadDashboard} className="underline ml-4 text-xs font-bold text-white">
            Retry
          </button>
        </div>
      )}

      {/* 6 Key Analytics Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title={tr('dashboard.totalSOS')}
          value={stats?.total_sos ?? '—'}
          icon="🆘"
          color="red"
          loading={loading}
          subtitle="All recorded calls"
        />
        <StatCard
          title={tr('dashboard.criticalEmergencies')}
          value={stats?.critical_emergencies ?? '—'}
          icon="🚨"
          color="red"
          loading={loading}
          subtitle="Immediate response"
        />
        <StatCard
          title={tr('dashboard.activeAlerts')}
          value={stats?.active_alerts ?? '—'}
          icon="🔔"
          color="orange"
          loading={loading}
          subtitle="Disaster zones"
        />
        <StatCard
          title={tr('dashboard.rescuedPeople')}
          value={stats?.rescued_people ?? '—'}
          icon="✅"
          color="green"
          loading={loading}
          subtitle="Lives secured"
        />
        <StatCard
          title={tr('dashboard.availableTeams')}
          value={stats ? `${stats.available_teams}/${stats.total_teams}` : '—'}
          icon="🚁"
          color="blue"
          loading={loading}
          subtitle="Deployment ready"
        />
        <StatCard
          title={tr('dashboard.availableResources')}
          value={stats?.available_resources ?? '—'}
          icon="📦"
          color="purple"
          loading={loading}
          subtitle="Relief units"
        />
      </div>

      {/* Incident Stream & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent SOS Feed — requires rescue login to view details */}
        <div className="lg:col-span-2 bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222222]">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚨</span>
              <h2 className="text-white font-bold text-base">Emergency Operations Summary</h2>
            </div>
            <Link
              to="/rescue-management"
              className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1"
            >
              <span>Rescue Portal</span>
              <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#1a1a1a] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats ? (
            <div className="space-y-3">
              {[
                { icon: '⏳', label: 'Pending Response', value: stats.pending_sos, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/40' },
                { icon: '🚁', label: 'Rescue In Progress', value: stats.in_progress_sos, color: 'text-orange-400', bg: 'bg-orange-950/20 border-orange-900/40' },
                { icon: '✅', label: 'People Rescued', value: stats.rescued_people, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/40' },
                { icon: '🚨', label: 'Critical Emergencies Active', value: stats.critical_emergencies, color: 'text-red-400', bg: 'bg-red-950/20 border-red-900/40' },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between p-3.5 rounded-xl border ${item.bg}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-gray-200 text-sm font-medium">{item.label}</span>
                  </div>
                  <span className={`text-2xl font-black font-mono ${item.color}`}>{item.value}</span>
                </div>
              ))}
              <div className="p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] text-xs text-gray-400 flex items-center gap-2">
                <span>🔐</span>
                <span>Detailed victim SOS records are available to authenticated rescue personnel only. <Link to="/rescue-login" className="text-blue-400 underline">Rescue Login →</Link></span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-10">{tr('common.noData')}</p>
          )}
        </div>

        {/* SOS Priority / Triage Chart */}
        <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#222222]">
            <span className="text-lg">📊</span>
            <h2 className="text-white font-bold text-base">Urgency Triage Breakdown</h2>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-2">
            {!loading && pieData.length > 0 ? (
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#141414" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1c1c1c',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-36 flex items-center justify-center text-gray-500 text-sm">
                {loading ? tr('common.loading') : tr('common.noData')}
              </div>
            )}

            {!loading && pieData.length > 0 && (
              <div className="grid grid-cols-2 gap-2 w-full mt-4 border-t border-[#222222] pt-4">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs px-2 py-1 bg-[#1a1a1a] rounded">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-300 font-medium">{d.name}</span>
                    </div>
                    <span className="text-white font-bold font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Alerts Highlights */}
      <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <h2 className="text-white font-bold text-base">{tr('alerts.title')}</h2>
          </div>
          <Link to="/alerts" className="text-red-400 hover:text-red-300 text-xs font-semibold">
            All Alerts ({recentAlerts.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="h-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
        ) : recentAlerts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">{tr('alerts.noAlerts')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 bg-[#1b1b1b] rounded-xl border border-[#2a2a2a] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{DISASTER_ICONS[alert.disaster_type] || '⚠️'}</span>
                      <Badge status={alert.severity} />
                    </div>
                    <Badge status={alert.source} />
                  </div>
                  <h3 className="text-white text-sm font-bold mt-1">{alert.location}</h3>
                  <p className="text-gray-300 text-xs mt-1.5 line-clamp-2 leading-relaxed">{alert.description}</p>
                </div>
                {alert.safety_actions?.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#262626] text-[11px] text-emerald-400 flex items-center gap-1">
                    <span>✓</span>
                    <span className="truncate">{alert.safety_actions[0]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
          {tr('dashboard.quickActions')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { to: '/risk-assessment', label: tr('nav.riskAssessment'), icon: '🔬', desc: 'AI Flood & Landslide' },
            { to: '/emergency-sos', label: tr('nav.emergencySOS'), icon: '🆘', desc: 'Offline SOS Sync' },
            { to: '/live-rescue-map', label: tr('nav.liveRescueMap'), icon: '🗺️', desc: 'Live OpenStreetMap' },
            { to: '/resource-management', label: tr('nav.resourceManagement'), icon: '📦', desc: 'Logistics & Shortage' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="bg-[#141414] hover:bg-[#1f1f1f] border border-[#222222] hover:border-red-900/60 rounded-xl p-4 text-center transition-all group shadow-md"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
              <div className="text-white text-sm font-bold group-hover:text-red-400 transition-colors">
                {item.label}
              </div>
              <div className="text-gray-500 text-xs mt-1">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
