import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const DISASTER_ICONS = {
  flood: '🌊', landslide: '⛰️', earthquake: '🏚️',
  cyclone: '🌀', forest_fire: '🔥', cloudburst: '⛈️',
};

export default function RescueDashboard() {
  const { tr, rescueUser } = useApp();
  const [stats, setStats]           = useState(null);
  const [recentSOS, setRecentSOS]   = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, sosRes, alertsRes] = await Promise.all([
        apiService.fetchStats(),
        apiService.fetchSOS(),
        apiService.fetchAlerts(),
      ]);
      setStats(statsRes.data);
      setRecentSOS((sosRes.data || []).slice(-5).reverse());
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
        { name: tr('dashboard.criticalEmergencies'), value: stats.critical_emergencies || 0,  color: '#dc2626' },
        { name: tr('status.pending'),                value: stats.pending_sos || 0,            color: '#f59e0b' },
        { name: tr('status.in_progress'),            value: stats.in_progress_sos || 0,        color: '#3b82f6' },
        {
          name: tr('status.rescued'),
          value: Math.max(0,
            (stats.total_sos || 0) -
            (stats.critical_emergencies || 0) -
            (stats.pending_sos || 0) -
            (stats.in_progress_sos || 0)
          ),
          color: '#10b981',
        },
      ].filter(d => d.value > 0)
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {tr('appName')} {tr('commandCenter')}
            </h1>
            <span className="bg-red-950/80 text-red-400 border border-red-800 text-xs px-2.5 py-0.5 rounded-full font-bold">{tr('live')}</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            {rescueUser ? `${tr('loggedInAs')} ${rescueUser.name} · ${rescueUser.badge || rescueUser.role}` : tr('tagline')}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to="/rescue-dashboard/rescue-management"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-red-900/50 flex items-center gap-2">
            <span>🚁</span><span>{tr('sosManagement')}</span>
          </Link>
          <Link to="/rescue-dashboard/live-rescue-map"
            className="bg-[#1e1e1e] hover:bg-[#282828] border border-[#333333] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2">
            <span>🗺️</span><span>{tr('nav.liveRescueMap')}</span>
          </Link>
          <button onClick={loadDashboard}
            className="p-2.5 bg-[#1e1e1e] hover:bg-[#282828] border border-[#333333] text-gray-300 hover:text-white rounded-lg text-sm transition-all" title={tr('common.refresh')}>
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-red-300 text-sm flex items-center justify-between">
          <span>⚠️ {error}. {tr('backendError')}</span>
          <button onClick={loadDashboard} className="underline ml-4 text-xs font-bold text-white">{tr('retry')}</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard title={tr('dashboard.totalSOS')}           value={stats?.total_sos ?? '—'}          icon="🆘" color="red"    loading={loading} subtitle={tr('dashboard.allRecorded')} />
        <StatCard title={tr('dashboard.criticalEmergencies')} value={stats?.critical_emergencies ?? '—'} icon="🚨" color="red"    loading={loading} subtitle={tr('dashboard.needsResponse')} />
        <StatCard title={tr('dashboard.activeAlerts')}       value={stats?.active_alerts ?? '—'}      icon="🔔" color="orange" loading={loading} subtitle={tr('dashboard.disasterZones')} />
        <StatCard title={tr('dashboard.rescuedPeople')}      value={stats?.rescued_people ?? '—'}     icon="✅" color="green"  loading={loading} subtitle={tr('dashboard.livesSecured')} />
        <StatCard title={tr('dashboard.availableTeams')}     value={stats ? `${stats.available_teams}/${stats.total_teams}` : '—'} icon="🚁" color="blue" loading={loading} subtitle={tr('dashboard.deploymentReady')} />
        <StatCard title={tr('dashboard.availableResources')} value={stats?.available_resources ?? '—'} icon="📦" color="purple" loading={loading} subtitle={tr('dashboard.reliefUnits')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live SOS feed */}
        <div className="lg:col-span-2 bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222222]">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚨</span>
              <h2 className="text-white font-bold text-base">{tr('liveEmergencyTriage')}</h2>
            </div>
            <Link to="/rescue-dashboard/rescue-management" className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1">
              {tr('manageAll')}
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-[#1a1a1a] rounded-lg animate-pulse" />)}</div>
          ) : recentSOS.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">{tr('common.noData')}</p>
          ) : (
            <div className="space-y-3">
              {recentSOS.map(sos => (
                <div key={sos.id} className="flex items-start gap-3 p-3.5 bg-[#1b1b1b] hover:bg-[#202020] rounded-xl border border-[#2a2a2a] transition-colors">
                  <span className="text-2xl p-2 bg-black/40 rounded-lg flex-shrink-0">{DISASTER_ICONS[sos.emergency_type] || '🆘'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-bold">{sos.name}</span>
                      <Badge status={sos.priority} />
                      <Badge status={sos.status} />
                      {sos.notes?.includes('DEMO') && <span className="text-blue-400 text-[10px] bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/60 font-mono">{tr('demoData')}</span>}
                    </div>
                    <p className="text-gray-300 text-xs mt-1 truncate">{sos.description}</p>
                    <div className="flex items-center gap-4 text-gray-500 text-[11px] mt-1.5">
                      <span>👥 {sos.num_people}</span>
                      <span>📍 {sos.location_name || tr('coordsLogged')}</span>
                      <span>📞 {sos.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#222222]">
            <span className="text-lg">📊</span>
            <h2 className="text-white font-bold text-base">{tr('urgencyBreakdown')}</h2>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center py-2">
            {!loading && pieData.length > 0 ? (
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="#141414" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
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
                {pieData.map(d => (
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

      {/* Recent alerts */}
      <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <h2 className="text-white font-bold text-base">{tr('alerts.title')}</h2>
          </div>
          <Link to="/rescue-dashboard/alerts" className="text-red-400 hover:text-red-300 text-xs font-semibold">
            {tr('all')} ({recentAlerts.length}) →
          </Link>
        </div>
        {loading ? (
          <div className="h-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
        ) : recentAlerts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">{tr('alerts.noAlerts')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAlerts.map(alert => (
              <div key={alert.id} className="p-4 bg-[#1b1b1b] rounded-xl border border-[#2a2a2a] flex flex-col justify-between">
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
                    <span>✓</span><span className="truncate">{alert.safety_actions[0]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick nav */}
      <div>
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">{tr('dashboard.quickActions')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { to: '/rescue-dashboard/risk-assessment',      label: tr('nav.riskAssessment'),      icon: '🔬', desc: tr('aiFloodLandslide') },
            { to: '/rescue-dashboard/rescue-management',    label: tr('nav.rescueManagement'),    icon: '🚁', desc: tr('sosOperations') },
            { to: '/rescue-dashboard/live-rescue-map',      label: tr('nav.liveRescueMap'),       icon: '🗺️', desc: tr('liveMap') },
            { to: '/rescue-dashboard/resource-management',  label: tr('nav.resourceManagement'),  icon: '📦', desc: tr('logisticsShortage') },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className="bg-[#141414] hover:bg-[#1f1f1f] border border-[#222222] hover:border-red-900/60 rounded-xl p-4 text-center transition-all group shadow-md">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
              <div className="text-white text-sm font-bold group-hover:text-red-400 transition-colors">{item.label}</div>
              <div className="text-gray-500 text-xs mt-1">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
