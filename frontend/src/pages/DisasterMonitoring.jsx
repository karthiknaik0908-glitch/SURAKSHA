import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import Badge from '../components/Badge';

const DISASTERS = [
  { id: 'flood', icon: '🌊', name: 'Flood', color: 'blue', desc: 'River overflow, reservoir discharge, urban flash floods', aiSupported: true },
  { id: 'landslide', icon: '⛰️', name: 'Landslide', color: 'amber', desc: 'Slope failure, mudflows, debris avalanches', aiSupported: true },
  { id: 'earthquake', icon: '🏚️', name: 'Earthquake', color: 'purple', desc: 'Tectonic tremors, seismic shocks, building damage', aiSupported: false },
  { id: 'cyclone', icon: '🌀', name: 'Cyclone', color: 'cyan', desc: 'Tropical depressions, gale winds, coastal storm surge', aiSupported: false },
  { id: 'forest_fire', icon: '🔥', name: 'Forest Fire', color: 'rose', desc: 'Wildland bushfire, forest canopy blaze', aiSupported: false },
  { id: 'cloudburst', icon: '⛈️', name: 'Cloudburst', color: 'indigo', desc: 'Sudden hyper-localized precipitation (>100mm/hr)', aiSupported: false },
];

export default function DisasterMonitoring() {
  const { tr, isRescueAuthenticated } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    disaster_type: 'flood',
    location: '',
    severity: 'high',
    description: '',
    source: 'user_reported',
    safety_actions: [],
  });
  const [actionInput, setActionInput] = useState('');

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await apiService.fetchAlerts();
      setAlerts(res.data || []);
    } catch (e) {
      console.error('Failed to load disaster alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const addAction = () => {
    if (actionInput.trim()) {
      setForm((f) => ({ ...f, safety_actions: [...f.safety_actions, actionInput.trim()] }));
      setActionInput('');
    }
  };

  const removeAction = (idx) => {
    setForm((f) => ({ ...f, safety_actions: f.safety_actions.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });
    try {
      await apiService.createAlert(form);
      setMsg({ type: 'success', text: 'Disaster incident alert published successfully!' });
      setShowForm(false);
      setForm({
        disaster_type: 'flood',
        location: '',
        severity: 'high',
        description: '',
        source: 'user_reported',
        safety_actions: [],
      });
      await loadAlerts();
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (selectedCategory === 'all') return true;
    return a.disaster_type === selectedCategory;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🌊</span>
            <span>{tr('nav.disasterMonitoring')}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Active multi-hazard tracking covering 6 key disaster categories with verifiable source provenance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isRescueAuthenticated ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-red-900/50 flex items-center gap-2"
            >
              <span>🚨</span>
              <span>{showForm ? tr('common.cancel') : tr('alerts.create')}</span>
            </button>
          ) : (
            <Link
              to="/rescue-login"
              className="bg-[#1c1c1c] hover:bg-[#282828] border border-[#444] text-gray-300 hover:text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <span>🔐</span>
              <span>Rescue Login to Report</span>
            </Link>
          )}
        </div>
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

      {/* Broadcast Form Modal / Card */}
      {showForm && (
        <div className="bg-[#141414] rounded-xl border border-red-900/60 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <span>📢</span>
              <span>{tr('alerts.create')}</span>
            </h2>
            <span className="text-gray-400 text-xs">Publish to live response feed</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase block mb-1.5">
                  {tr('alerts.disasterType')} *
                </label>
                <select
                  value={form.disaster_type}
                  onChange={(e) => setForm({ ...form, disaster_type: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                >
                  {DISASTERS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.icon} {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase block mb-1.5">
                  {tr('alerts.location')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Cauvery River Basin, Mandya"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                >
                </input>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase block mb-1.5">
                  {tr('alerts.severity')} *
                </label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                >
                  <option value="low">Low Severity</option>
                  <option value="medium">Medium Severity</option>
                  <option value="high">High Severity</option>
                  <option value="critical">Critical Severity</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase block mb-1.5">
                  {tr('alerts.source')} *
                </label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                >
                  <option value="official_alert">{tr('alerts.officialAlert')}</option>
                  <option value="risk_assessment">{tr('alerts.riskAssessment')}</option>
                  <option value="user_reported">{tr('alerts.userReported')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase block mb-1.5">
                {tr('alerts.description')} *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Details of water levels, terrain conditions, impacted villages or routes..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg p-3 text-sm focus:border-red-500 outline-none resize-none"
              />
            </div>

            {/* Safety Actions */}
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase block mb-1.5">
                {tr('alerts.safetyActions')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={tr('alerts.addAction')}
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAction())}
                  className="flex-1 bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                />
                <button
                  type="button"
                  onClick={addAction}
                  className="bg-[#2a2a2a] hover:bg-[#333333] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  + Add
                </button>
              </div>

              {form.safety_actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.safety_actions.map((act, i) => (
                    <span
                      key={i}
                      className="bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    >
                      <span>✓ {act}</span>
                      <button
                        type="button"
                        onClick={() => removeAction(i)}
                        className="text-emerald-400 hover:text-red-400 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-gray-300 rounded-lg text-sm font-semibold transition-colors"
              >
                {tr('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all shadow-md"
              >
                {submitting ? tr('common.loading') : 'Broadcast Alert'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6 Disaster Category Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Monitored Hazard Categories</h2>
          <span className="text-gray-400 text-xs">Select a hazard to filter alerts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DISASTERS.map((disaster) => {
            const categoryAlerts = alerts.filter((a) => a.disaster_type === disaster.id);
            const isSelected = selectedCategory === disaster.id;

            return (
              <div
                key={disaster.id}
                onClick={() => setSelectedCategory(isSelected ? 'all' : disaster.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-red-500 bg-red-950/20 ring-1 ring-red-500'
                    : 'border-[#222222] bg-[#141414] hover:bg-[#1a1a1a] hover:border-[#333333]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2.5 bg-black/40 rounded-xl">{disaster.icon}</span>
                    <div>
                      <h3 className="text-white font-bold text-base flex items-center gap-1.5">
                        {disaster.name}
                        {disaster.aiSupported ? (
                          <span className="bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
                            AI Model
                          </span>
                        ) : (
                          <span className="bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
                            Incident Feed
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-1">{disaster.desc}</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      categoryAlerts.length > 0
                        ? 'bg-red-600 text-white'
                        : 'bg-[#222222] text-gray-500'
                    }`}
                  >
                    {categoryAlerts.length}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    {disaster.aiSupported
                      ? 'Rule-based quantitative triage'
                      : 'Citizen & verified authority reports'}
                  </span>
                  <span className="text-red-400 font-medium">
                    {isSelected ? 'Selected' : 'Filter →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs font-bold uppercase">Showing:</span>
          <span className="text-white text-xs font-semibold px-2.5 py-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded">
            {selectedCategory === 'all'
              ? 'All Categories'
              : DISASTERS.find((d) => d.id === selectedCategory)?.name}
          </span>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-red-400 hover:text-red-300 underline font-medium"
            >
              Reset filter
            </button>
          )}
        </div>
        <span className="text-gray-400 text-xs font-mono">
          {filteredAlerts.length} Active Notice{filteredAlerts.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Alerts Feed */}
      <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg space-y-4">
        <h2 className="text-white font-bold text-base flex items-center gap-2 pb-3 border-b border-[#222222]">
          <span>📋</span>
          <span>Verified Incident & Hazard Alerts</span>
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            No alerts reported for this category.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-5 bg-[#1b1b1b] rounded-xl border border-[#262626] hover:border-[#3a3a3a] transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-black/40 rounded-lg">
                      {DISASTERS.find((d) => d.id === alert.disaster_type)?.icon || '⚠️'}
                    </span>
                    <div>
                      <h3 className="text-white font-bold text-base">{alert.location}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge status={alert.disaster_type} />
                        <Badge status={alert.severity} />
                        <Badge status={alert.source} />
                        {alert.notes?.includes('DEMO') && (
                          <span className="text-blue-400 text-[10px] font-mono bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/50">
                            DEMO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-gray-500 text-xs font-mono">
                    🕐 {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed pl-1 sm:pl-12">
                  {alert.description}
                </p>

                {alert.safety_actions && alert.safety_actions.length > 0 && (
                  <div className="pl-1 sm:pl-12 pt-2 border-t border-[#242424]">
                    <span className="text-gray-400 text-xs font-semibold block mb-1.5">
                      Required Safety Precautions:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {alert.safety_actions.map((act, i) => (
                        <span
                          key={i}
                          className="bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1"
                        >
                          <span>✓</span>
                          <span>{act}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
