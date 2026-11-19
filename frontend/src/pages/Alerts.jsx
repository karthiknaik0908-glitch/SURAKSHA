import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import Badge from '../components/Badge';

const DISASTER_ICONS = {
  flood: '🌊',
  landslide: '⛰️',
  earthquake: '🏚️',
  cyclone: '🌀',
  forest_fire: '🔥',
  cloudburst: '⛈️',
};

export default function Alerts() {
  const { tr, isRescueAuthenticated } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    disaster_type: 'flood',
    location: '',
    severity: 'high',
    description: '',
    source: 'official_alert',
    safety_actions: [],
  });
  const [actionInput, setActionInput] = useState('');

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await apiService.fetchAlerts();
      setAlerts(res.data || []);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 20000);
    return () => clearInterval(interval);
  }, []);

  // Request browser notification
  const requestNotify = async () => {
    if (!('Notification' in window)) {
      alert('Desktop notifications are not supported in this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('SURAKSHA Alert System Active', {
        body: 'You will receive instant desktop alerts for critical disaster warnings.',
        icon: '/favicon.svg',
      });
      setMsg({ type: 'success', text: 'Browser desktop notifications enabled!' });
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

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
      setMsg({ type: 'success', text: 'Early warning alert registered and broadcasted!' });
      setShowModal(false);
      setForm({
        disaster_type: 'flood',
        location: '',
        severity: 'high',
        description: '',
        source: 'official_alert',
        safety_actions: [],
      });
      await loadAlerts();

      // Trigger notification if granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`SURAKSHA ALERT: ${form.disaster_type.toUpperCase()}`, {
          body: `${form.location} (${form.severity.toUpperCase()} RISK) - ${form.description}`,
          icon: '/favicon.svg',
        });
      }
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterSource !== 'all' && a.source !== filterSource) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🔔</span>
            <span>{tr('alerts.title')}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Official civil defense warnings, citizen field alerts, and AI risk projections
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={requestNotify}
            className="bg-[#1c1c1c] hover:bg-[#282828] border border-[#333333] text-gray-300 hover:text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>🔔</span>
            <span>Enable Desktop Notifications</span>
          </button>
          {isRescueAuthenticated ? (
            <button
              onClick={() => setShowModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-red-900/50 flex items-center gap-1.5"
            >
              <span>➕</span>
              <span>{tr('alerts.create')}</span>
            </button>
          ) : (
            <Link
              to="/rescue-login"
              className="bg-[#1c1c1c] hover:bg-[#282828] border border-[#444] text-gray-300 hover:text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>🔐</span>
              <span>Rescue Login to Broadcast</span>
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

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141414] p-4 rounded-xl border border-[#222222]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-400 text-xs font-bold uppercase mr-1">Severity:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                filterSeverity === sev
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-[#1e1e1e] text-gray-400 hover:text-white border border-[#2a2a2a]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-400 text-xs font-bold uppercase mr-1">Source:</span>
          {[
            { id: 'all', label: 'All Sources' },
            { id: 'official_alert', label: '✅ Official' },
            { id: 'risk_assessment', label: '🤖 AI Model' },
            { id: 'user_reported', label: '👤 User Report' },
          ].map((src) => (
            <button
              key={src.id}
              onClick={() => setFilterSource(src.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterSource === src.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-[#1e1e1e] text-gray-400 hover:text-white border border-[#2a2a2a]'
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-[#141414] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-[#141414] rounded-xl border border-[#222222] p-12 text-center text-gray-500 text-sm">
            {tr('alerts.noAlerts')}
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-5 bg-[#141414] rounded-xl border border-[#262626] hover:border-red-900/50 transition-all shadow-lg space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222222] pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2.5 bg-black/40 rounded-xl">
                    {DISASTER_ICONS[alert.disaster_type] || '⚠️'}
                  </span>
                  <div>
                    <h3 className="text-white font-extrabold text-base flex items-center gap-2">
                      <span>{alert.location}</span>
                    </h3>
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

                <div className="text-gray-500 text-xs font-mono self-start sm:self-auto">
                  🕐 {new Date(alert.created_at).toLocaleString()}
                </div>
              </div>

              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed pl-1 sm:pl-14">
                {alert.description}
              </p>

              {alert.safety_actions && alert.safety_actions.length > 0 && (
                <div className="pl-1 sm:pl-14 pt-2 border-t border-[#222222]">
                  <span className="text-gray-400 text-xs font-semibold block mb-1.5">
                    {tr('alerts.safetyActions')}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {alert.safety_actions.map((act, i) => (
                      <span
                        key={i}
                        className="bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
                      >
                        <span className="font-bold">✓</span>
                        <span>{act}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Broadcast Alert Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#141414] rounded-2xl border border-[#333333] p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h2 className="text-white font-extrabold text-base flex items-center gap-2">
                <span>📢</span>
                <span>{tr('alerts.create')}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs font-semibold block mb-1">
                    {tr('alerts.disasterType')} *
                  </label>
                  <select
                    value={form.disaster_type}
                    onChange={(e) => setForm({ ...form, disaster_type: e.target.value })}
                    className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-xs focus:border-red-500 outline-none"
                  >
                    {Object.keys(DISASTER_ICONS).map((k) => (
                      <option key={k} value={k}>
                        {DISASTER_ICONS[k]} {k.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-semibold block mb-1">
                    {tr('alerts.severity')} *
                  </label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-xs focus:border-red-500 outline-none"
                  >
                    <option value="low">Low Severity</option>
                    <option value="medium">Medium Severity</option>
                    <option value="high">High Severity</option>
                    <option value="critical">Critical Severity</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">
                  {tr('alerts.location')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Western Ghats Foothills, Sakleshpur"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">
                  {tr('alerts.source')} *
                </label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-xs focus:border-red-500 outline-none"
                >
                  <option value="official_alert">{tr('alerts.officialAlert')}</option>
                  <option value="risk_assessment">{tr('alerts.riskAssessment')}</option>
                  <option value="user_reported">{tr('alerts.userReported')}</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">
                  {tr('alerts.description')} *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe weather warnings, river crest levels, or evacuation recommendations..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg p-3 text-xs sm:text-sm focus:border-red-500 outline-none resize-none"
                />
              </div>

              {/* Safety Actions */}
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">
                  {tr('alerts.safetyActions')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an actionable precaution..."
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAction())}
                    className="flex-1 bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-1.5 text-xs focus:border-red-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addAction}
                    className="bg-[#2a2a2a] hover:bg-[#333333] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    + Add
                  </button>
                </div>

                {form.safety_actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.safety_actions.map((act, i) => (
                      <span
                        key={i}
                        className="bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1"
                      >
                        <span>✓ {act}</span>
                        <button
                          type="button"
                          onClick={() => removeAction(i)}
                          className="text-red-400 font-bold ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-gray-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  {tr('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  {submitting ? tr('common.loading') : 'Broadcast Warning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
