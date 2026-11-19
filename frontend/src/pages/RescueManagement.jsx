import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import Badge from '../components/Badge';

export default function RescueManagement() {
  const { tr } = useApp();
  const [sosList, setSosList] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [sosRes, teamRes] = await Promise.all([
        apiService.fetchSOS(),
        apiService.fetchRescueTeams(),
      ]);
      setSosList(sosRes.data || []);
      setTeams(teamRes.data || []);
    } catch (e) {
      console.error('Error fetching rescue operations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (sosId, newStatus, teamId = null) => {
    setUpdatingId(sosId);
    try {
      const payload = { status: newStatus };
      if (teamId) payload.assigned_team_id = teamId;
      await apiService.updateSOSStatus(sosId, payload);
      setMsg({ type: 'success', text: `SOS status updated to ${newStatus.toUpperCase()}` });
      setSelectedSOS(null);
      await loadData();
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSOS = sosList.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && s.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.location_name?.toLowerCase().includes(q) ||
        s.emergency_type?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
      );
    }
    return true;
  });

  const counts = {
    pending: sosList.filter((s) => s.status === 'pending').length,
    assigned: sosList.filter((s) => s.status === 'assigned').length,
    in_progress: sosList.filter((s) => s.status === 'in_progress').length,
    rescued: sosList.filter((s) => s.status === 'rescued').length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🚁</span>
            <span>{tr('rescue.title')}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {tr('rescue.subtitle')}
          </p>
        </div>

        <button
          onClick={loadData}
          className="bg-[#1c1c1c] hover:bg-[#282828] border border-[#333333] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <span>🔄</span>
          <span>{tr('rescue.refreshIncidents')}</span>
        </button>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            msg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border-red-800 text-red-300'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* 4 Status Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { key: 'pending', label: tr('rescue.pendingTriage'), icon: '⏳', count: counts.pending, color: 'text-amber-400 border-amber-900/60 bg-amber-950/20' },
          { key: 'assigned', label: tr('rescue.teamAssigned'), icon: '📋', count: counts.assigned, color: 'text-blue-400 border-blue-900/60 bg-blue-950/20' },
          { key: 'in_progress', label: tr('rescue.extractionInProgress'), icon: '🚁', count: counts.in_progress, color: 'text-orange-400 border-orange-900/60 bg-orange-950/20' },
          { key: 'rescued', label: tr('rescue.rescuedSecured'), icon: '✅', count: counts.rescued, color: 'text-emerald-400 border-emerald-900/60 bg-emerald-950/20' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(statusFilter === item.key ? 'all' : item.key)}
            className={`p-4 rounded-xl border transition-all text-left flex items-center justify-between ${
              item.color
            } ${statusFilter === item.key ? 'ring-2 ring-white/60' : 'hover:scale-[1.01]'}`}
          >
            <div>
              <span className="text-xs uppercase font-bold tracking-wider opacity-80 block">{item.label}</span>
              <span className="text-2xl font-black font-mono mt-1 block">{item.count}</span>
            </div>
            <span className="text-3xl p-2 bg-black/40 rounded-xl">{item.icon}</span>
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141414] p-4 rounded-xl border border-[#222222]">
        <div className="flex-1 min-w-[220px]">
          <input
            type="text"
            placeholder={tr('rescue.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none placeholder-gray-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-xs font-semibold focus:border-red-500 outline-none"
          >
            <option value="all">{tr('rescue.allStatuses')}</option>
            <option value="pending">{tr('status.pending')}</option>
            <option value="assigned">{tr('status.assigned')}</option>
            <option value="in_progress">{tr('status.in_progress')}</option>
            <option value="rescued">{tr('status.rescued')}</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-xs font-semibold focus:border-red-500 outline-none"
          >
            <option value="all">{tr('rescue.allPriorities')}</option>
            <option value="critical">{tr('status.critical')}</option>
            <option value="high">{tr('status.high')}</option>
            <option value="medium">{tr('status.medium')}</option>
          </select>
        </div>
      </div>

      {/* Management Detail Modal */}
      {selectedSOS && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedSOS(null)}
        >
          <div
            className="bg-[#141414] rounded-2xl border border-[#333333] p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h2 className="text-white font-extrabold text-lg flex items-center gap-2">
                <span>📋</span>
                <span>{tr('rescue.operationDetail')}</span>
              </h2>
              <button
                onClick={() => setSelectedSOS(null)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge status={selectedSOS.priority} />
                <Badge status={selectedSOS.status} />
                {selectedSOS.notes?.includes('DEMO') && (
                  <span className="text-blue-400 text-xs font-mono bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/50">
                    DEMO DATA
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-[#1c1c1c] rounded-xl border border-[#2a2a2a]">
                <div>
                  <span className="text-gray-400 block text-xs">{tr('rescue.victimCaller')}</span>
                  <span className="text-white font-bold">{selectedSOS.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">{tr('rescue.phoneContact')}</span>
                  <span className="text-white font-mono font-bold">{selectedSOS.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">{tr('rescue.disasterType')}</span>
                  <span className="text-white font-bold capitalize">{selectedSOS.emergency_type}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">{tr('rescue.peopleTrapped')}</span>
                  <span className="text-red-400 font-bold font-mono">{selectedSOS.num_people}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-400 block text-xs font-semibold mb-1">{tr('rescue.incidentReport')}</span>
                <p className="p-3 bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] text-gray-200 text-xs leading-relaxed">
                  {selectedSOS.description}
                </p>
              </div>

              {selectedSOS.location_name && (
                <div>
                  <span className="text-gray-400 block text-xs">{tr('rescue.landmark')}</span>
                  <span className="text-white font-medium">{selectedSOS.location_name}</span>
                </div>
              )}

              {selectedSOS.latitude && (
                <div>
                  <span className="text-gray-400 block text-xs">{tr('rescue.exactCoords')}</span>
                  <span className="text-white font-mono text-xs">
                    {selectedSOS.latitude.toFixed(6)}°N, {selectedSOS.longitude.toFixed(6)}°E
                  </span>
                </div>
              )}

              {selectedSOS.priority_reasons?.length > 0 && (
                <div className="p-3 bg-[#1a1414] rounded-xl border border-red-950/80">
                  <span className="text-red-400 block text-xs font-bold mb-1">
                    {tr('rescue.aiTriageScore')} {selectedSOS.priority_score}/100):
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-300 text-xs">
                    {selectedSOS.priority_reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Team Assignment & Status Overrides */}
            <div className="border-t border-[#222222] pt-4 space-y-3">
              <div>
                <label className="text-gray-300 text-xs font-bold uppercase tracking-wider block mb-1.5">
                  {tr('rescue.assignUnit')}
                </label>
                <select
                  value={assignTeamId}
                  onChange={(e) => setAssignTeamId(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-xs focus:border-red-500 outline-none"
                >
                  <option value="">{tr('rescue.selectTeam')}</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status.toUpperCase()} · {tr('rescue.capacity')} {t.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-300 text-xs font-bold uppercase tracking-wider block mb-1.5">
                  {tr('rescue.updateStatus')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['pending', 'assigned', 'in_progress', 'rescued'].map((st) => (
                    <button
                      key={st}
                      disabled={updatingId === selectedSOS.id}
                      onClick={() => updateStatus(selectedSOS.id, st, assignTeamId || undefined)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                        selectedSOS.status === st
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-[#222222] hover:bg-[#2c2c2c] text-gray-300'
                      }`}
                    >
                      {updatingId === selectedSOS.id ? '...' : tr(`status.${st}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOS List Table / Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#141414] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredSOS.length === 0 ? (
          <div className="bg-[#141414] rounded-xl border border-[#222222] p-12 text-center text-gray-500 text-sm">
            {tr('rescue.noMatchFilter')}
          </div>
        ) : (
          filteredSOS.map((sos) => (
            <div
              key={sos.id}
              onClick={() => setSelectedSOS(sos)}
              className="p-5 bg-[#141414] hover:bg-[#1a1a1a] rounded-xl border border-[#222222] hover:border-red-900/60 transition-all cursor-pointer shadow-lg space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl p-2.5 bg-black/40 rounded-xl">
                    {sos.emergency_type === 'flood' ? '🌊' : sos.emergency_type === 'landslide' ? '⛰️' : '🚨'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-extrabold text-base">{sos.name}</span>
                      <Badge status={sos.priority} />
                      <Badge status={sos.status} />
                      {sos.notes?.includes('DEMO') && (
                        <span className="text-blue-400 text-[10px] font-mono bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/50">
                          DEMO
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {sos.location_name || (sos.latitude ? `${sos.latitude.toFixed(4)}, ${sos.longitude.toFixed(4)}` : tr('coordsLogged'))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-gray-500 text-xs font-mono">
                    🕐 {new Date(sos.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSOS(sos);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    Manage →
                  </button>
                </div>
              </div>

              <p className="text-gray-300 text-xs sm:text-sm pl-1 sm:pl-14 line-clamp-2">
                {sos.description}
              </p>

              <div className="flex items-center gap-4 text-gray-500 text-xs pl-1 sm:pl-14 pt-2 border-t border-[#222222]">
                <span>👥 {sos.num_people} {tr('rescue.peopleAffected')}</span>
                <span>📞 {sos.phone}</span>
                <span>{tr('rescue.urgencyScore')} <strong className="text-white font-mono">{sos.priority_score}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Available Rescue Teams Fleet */}
      <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg space-y-4">
        <h3 className="text-white font-bold text-base flex items-center gap-2 pb-3 border-b border-[#222222]">
          <span>🚁</span>
          <span>{tr('rescue.registeredUnits')}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div key={t.id} className="p-4 bg-[#1b1b1b] rounded-xl border border-[#282828] space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold text-sm">{t.name}</h4>
                <Badge status={t.status} />
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>📍 {tr('rescue.base')} {t.location}</div>
                <div>👥 {tr('rescue.capacity')} {t.capacity} {tr('rescue.members')}</div>
                <div>📞 {tr('rescue.comm')} {t.contact}</div>
                {t.notes?.includes('DEMO') && <div className="text-blue-400 font-mono text-[10px]">{tr('demoUnit')}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
