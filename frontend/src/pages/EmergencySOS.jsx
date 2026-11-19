import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import {
  savePendingSOSLocal,
  getPendingSOSLocal,
  markSOSSynced,
} from '../hooks/useOfflineDB';
import Badge from '../components/Badge';

// Status color helpers for the tracking panel
const STATUS_PROGRESS = {
  pending: 1,
  assigned: 2,
  in_progress: 3,
  rescued: 4,
};

function TrackingPanel() {
  const { tr } = useApp();
  const [ticketId, setTicketId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [trackError, setTrackError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!ticketId.trim() || !phone.trim()) {
      setTrackError('Both Ticket ID and phone number are required.');
      return;
    }
    setLoading(true);
    setTrackError('');
    setResult(null);
    try {
      const res = await apiService.trackSOS({ ticket_id: ticketId.trim(), phone: phone.trim() });
      setResult(res.data);
    } catch (err) {
      setTrackError(
        err.message.includes('404') || err.message.toLowerCase().includes('not found')
          ? 'No matching record found. Please verify your SOS Ticket ID and the phone number you registered with.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Pending', 'Assigned', 'In Progress', 'Rescued'];
  const currentStep = result ? STATUS_PROGRESS[result.status] || 1 : 0;

  return (
    <div className="bg-[#141414] rounded-xl border border-[#222222] p-6 shadow-xl space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-[#222222]">
        <span className="text-xl">🔍</span>
        <div>
          <h2 className="text-white font-bold text-sm">Track Your SOS Request</h2>
          <p className="text-gray-400 text-xs">Use your Ticket ID and registered phone number</p>
        </div>
      </div>

      <form onSubmit={handleTrack} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-gray-400 text-xs font-semibold block mb-1">SOS Ticket ID</label>
          <input
            type="text"
            placeholder="Paste your ticket UUID..."
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs font-semibold block mb-1">Registered Phone</label>
          <input
            type="tel"
            placeholder="+91 9845012345"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          {loading ? <><span className="animate-spin">⚙️</span><span>Checking...</span></> : <><span>🔍</span><span>Track SOS</span></>}
        </button>
      </form>

      {trackError && (
        <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-start gap-2">
          <span>⚠️</span>
          <span>{trackError}</span>
        </div>
      )}

      {result && (
        <div className="bg-[#0f1420] rounded-xl border border-blue-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs text-gray-400 block">SOS Ticket</span>
              <span className="text-white font-mono font-bold text-sm">{result.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={result.priority} />
              <Badge status={result.status} />
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-0 overflow-x-auto pb-1">
            {stepLabels.map((label, idx) => {
              const step = idx + 1;
              const done = step < currentStep;
              const active = step === currentStep;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center min-w-[64px]">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        done
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : active
                          ? 'bg-blue-600 border-blue-400 text-white animate-pulse'
                          : 'bg-[#1a1a1a] border-[#333] text-gray-500'
                      }`}
                    >
                      {done ? '✓' : step}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium text-center ${
                        active ? 'text-blue-400' : done ? 'text-emerald-400' : 'text-gray-500'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < stepLabels.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 rounded ${
                        step < currentStep ? 'bg-emerald-600' : 'bg-[#2a2a2a]'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[#141414] rounded-lg border border-[#222]">
              <span className="text-gray-400 block text-[10px]">Name</span>
              <span className="text-white font-semibold">{result.name}</span>
            </div>
            <div className="p-2.5 bg-[#141414] rounded-lg border border-[#222]">
              <span className="text-gray-400 block text-[10px]">Emergency Type</span>
              <span className="text-white font-semibold capitalize">{result.emergency_type}</span>
            </div>
            <div className="p-2.5 bg-[#141414] rounded-lg border border-[#222]">
              <span className="text-gray-400 block text-[10px]">People Affected</span>
              <span className="text-white font-semibold font-mono">{result.num_people}</span>
            </div>
            <div className="p-2.5 bg-[#141414] rounded-lg border border-[#222]">
              <span className="text-gray-400 block text-[10px]">Submitted At</span>
              <span className="text-white font-semibold text-[11px]">
                {new Date(result.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {result.location_name && (
            <div className="p-2.5 bg-[#141414] rounded-lg border border-[#222] text-xs">
              <span className="text-gray-400 block text-[10px]">Location</span>
              <span className="text-white font-semibold">📍 {result.location_name}</span>
            </div>
          )}

          {result.assigned_team && (
            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800 text-xs space-y-1">
              <span className="text-emerald-400 font-bold block">✅ Rescue Team Assigned:</span>
              <span className="text-white font-semibold">{result.assigned_team.name}</span>
              <span className="text-gray-300 block">📞 {result.assigned_team.contact}</span>
              <Badge status={result.assigned_team.status} />
            </div>
          )}

          <p className="text-gray-500 text-[11px] flex items-center gap-1.5">
            <span>🔒</span>
            <span>Only you can view this record. Keep your Ticket ID and phone private.</span>
          </p>
        </div>
      )}
    </div>
  );
}

const EMERGENCY_TYPES = [
  'flood',
  'landslide',
  'earthquake',
  'cyclone',
  'forest_fire',
  'cloudburst',
  'medical',
  'structural_collapse',
  'other',
];

export default function EmergencySOS() {
  const { tr, isOnline, setPendingSOSCount } = useApp();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    emergency_type: 'flood',
    num_people: 1,
    description: '',
    latitude: null,
    longitude: null,
    location_name: '',
    injury_severity: 'moderate',
    immediate_danger: false,
    medical_emergency: false,
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submittedSOS, setSubmittedSOS] = useState(null);
  const [pendingList, setPendingList] = useState([]);
  const [syncStatus, setSyncStatus] = useState('');

  const loadPending = async () => {
    try {
      const pending = await getPendingSOSLocal();
      setPendingList(pending);
      setPendingSOSCount(pending.length);
    } catch (e) {
      console.error('Error loading pending offline SOS:', e);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  // Automatic synchronization when internet connection restores
  const syncOfflineRequests = async () => {
    if (!isOnline) return;
    try {
      const pending = await getPendingSOSLocal();
      if (pending.length === 0) return;

      setSyncStatus(`Synchronizing ${pending.length} pending offline SOS request(s)...`);
      for (const p of pending) {
        try {
          const { local_id, synced, created_at_local, ...payload } = p;
          const res = await apiService.createSOS(payload);
          await markSOSSynced(local_id, res.data?.id);
        } catch (e) {
          console.error(`Failed to sync SOS ${p.local_id}:`, e);
        }
      }
      await loadPending();
      setSyncStatus('All offline requests synchronized successfully!');
      setTimeout(() => setSyncStatus(''), 4000);
    } catch (err) {
      setSyncStatus('Synchronization error. Will retry when connection stabilizes.');
    }
  };

  useEffect(() => {
    if (isOnline) {
      syncOfflineRequests();
    }
  }, [isOnline]);

  const acquireGPS = () => {
    setGpsLoading(true);
    setGpsMessage({ type: '', text: '' });

    if (!navigator.geolocation) {
      setGpsMessage({
        type: 'error',
        text: 'Geolocation API is not supported in this browser. Please enter coordinates manually.',
      });
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        setGpsMessage({
          type: 'success',
          text: `Exact GPS Acquired: ${pos.coords.latitude.toFixed(5)}°N, ${pos.coords.longitude.toFixed(5)}°E (Accurate within ${Math.round(pos.coords.accuracy)}m)`,
        });
        setGpsLoading(false);
      },
      (err) => {
        setGpsMessage({
          type: 'error',
          text: `GPS Access Denied/Unavailable (${err.message}). Please enter latitude and longitude manually.`,
        });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmittedSOS(null);

    const sosPayload = {
      ...form,
      num_people: parseInt(form.num_people, 10) || 1,
    };

    if (!isOnline) {
      // Offline mode: store directly in IndexedDB
      try {
        const saved = await savePendingSOSLocal(sosPayload);
        await loadPending();
        setSubmittedSOS({
          offline: true,
          local_id: saved.local_id,
          message: tr('sos.offlineNotice'),
          data: saved,
        });
        resetForm();
      } catch (e) {
        alert('Failed to save SOS to IndexedDB: ' + e.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Online mode: attempt to POST to FastAPI backend
    try {
      const res = await apiService.createSOS(sosPayload);
      setSubmittedSOS({
        offline: false,
        data: res.data,
        message: 'Your emergency SOS has been received and prioritized by the AI triage engine.',
      });
      resetForm();
    } catch (networkError) {
      // Backend unreachable: fallback gracefully to IndexedDB offline storage
      const saved = await savePendingSOSLocal(sosPayload);
      await loadPending();
      setSubmittedSOS({
        offline: true,
        local_id: saved.local_id,
        message: 'Server unreachable. SOS request secured in IndexedDB and queued for auto-sync.',
        data: saved,
      });
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      phone: '',
      emergency_type: 'flood',
      num_people: 1,
      description: '',
      latitude: null,
      longitude: null,
      location_name: '',
      injury_severity: 'moderate',
      immediate_danger: false,
      medical_emergency: false,
    });
    setGpsMessage({ type: '', text: '' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="text-red-500 animate-pulse">🆘</span>
            <span>{tr('sos.title')}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">{tr('sos.subtitle')}</p>
        </div>

        {/* Sync notification */}
        {syncStatus && (
          <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span>🔄</span>
            <span>{syncStatus}</span>
          </div>
        )}
      </div>

      {/* Offline Status Alert */}
      {!isOnline && (
        <div className="bg-red-950/70 border border-red-700 rounded-xl p-4 shadow-lg flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-red-300 font-bold text-sm">{tr('sos.offline')}</h3>
            <p className="text-red-200/80 text-xs mt-1 leading-relaxed">
              {tr('sos.offlineNotice')}
            </p>
          </div>
        </div>
      )}

      {/* Pending Offline SOS Queue */}
      {pendingList.length > 0 && (
        <div className="bg-[#141414] rounded-xl border border-amber-800/80 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-amber-400 font-bold text-sm flex items-center gap-2">
              <span>⏳</span>
              <span>
                {tr('sos.pending')} ({pendingList.length})
              </span>
            </h3>
            {isOnline && (
              <button
                onClick={syncOfflineRequests}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded transition-colors"
              >
                Sync Now
              </button>
            )}
          </div>
          <div className="space-y-2">
            {pendingList.map((p) => (
              <div
                key={p.local_id}
                className="p-3 bg-[#1c1c1c] rounded-lg border border-[#2a2a2a] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white">{p.name}</span>
                  <span className="text-gray-400 ml-2">
                    ({p.emergency_type} • {p.num_people} people)
                  </span>
                  <p className="text-gray-400 text-[11px] mt-0.5 truncate max-w-md">{p.description}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800 text-[11px] font-mono">
                  IndexedDB Saved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success / Result Ticket */}
      {submittedSOS && (
        <div
          className={`p-6 rounded-xl border shadow-xl space-y-4 ${
            submittedSOS.offline
              ? 'bg-[#18120a] border-amber-700 text-amber-200'
              : 'bg-[#0f1d14] border-emerald-700 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{submittedSOS.offline ? '📱' : '✅'}</span>
            <div>
              <h2 className="text-lg font-bold text-white">
                {submittedSOS.offline
                  ? 'SOS Saved in Local Offline Storage'
                  : tr('sos.success')}
              </h2>
              <p className="text-xs text-gray-300 mt-0.5">{submittedSOS.message}</p>
            </div>
          </div>

          <div className="p-4 bg-black/50 rounded-xl border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-white/10">
              <span className="text-gray-400">{tr('sos.sosId')}:</span>
              <span className="font-mono font-bold text-white text-sm">
                {submittedSOS.data?.id || submittedSOS.data?.local_id}
              </span>
            </div>

            {!submittedSOS.offline && (
              <>
                <div className="flex justify-between items-center py-1 border-b border-white/10">
                  <span className="text-gray-400">{tr('sos.priority')}:</span>
                  <Badge status={submittedSOS.data?.priority} />
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/10">
                  <span className="text-gray-400">{tr('sos.score')}:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {submittedSOS.data?.priority_score} / 100
                  </span>
                </div>
                {submittedSOS.data?.priority_reasons?.length > 0 && (
                  <div className="py-1">
                    <span className="text-gray-400 block mb-1">AI Classification Factors:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-300 text-[11px]">
                      {submittedSOS.data.priority_reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <div className="pt-2 text-[11px] text-gray-300 flex items-center gap-2">
              <span>📌</span>
              <span>{tr('sos.instructions')}</span>
            </div>
          </div>

          <button
            onClick={() => setSubmittedSOS(null)}
            className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Submit Another Emergency Dispatch Request
          </button>
        </div>
      )}

      {/* SOS Form Card */}
      {!submittedSOS && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#141414] rounded-xl border border-[#222222] p-6 shadow-xl space-y-6"
        >
          {/* Hero Red SOS Button */}
          <div className="flex flex-col items-center justify-center py-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-44 h-44 rounded-full bg-gradient-to-br from-red-600 via-red-700 to-red-900 hover:from-red-500 hover:to-red-800 text-white font-black text-xl shadow-2xl shadow-red-900/70 border-4 border-red-500/80 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 select-none disabled:opacity-50"
            >
              <span className="text-4xl">🚨</span>
              <span className="tracking-wider">{submitting ? tr('sos.submitting') : tr('sos.submit')}</span>
              <span className="text-[10px] font-normal tracking-normal text-red-200">
                {isOnline ? 'Direct Broadcast' : 'Save Offline (IndexedDB)'}
              </span>
            </button>
            <p className="text-gray-400 text-xs mt-3 text-center max-w-sm">
              Press the SOS button or fill in details below to transmit priority triage parameters.
            </p>
          </div>

          {/* Victim & Emergency Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#222222]">
            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1.5">
                {tr('sos.name')} *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Rajan Kumar"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1.5">
                {tr('sos.phone')} *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g., +91 9845012345"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1.5">
                {tr('sos.emergencyType')} *
              </label>
              <select
                value={form.emergency_type}
                onChange={(e) => setForm({ ...form, emergency_type: e.target.value })}
                className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
              >
                {EMERGENCY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1.5">
                {tr('sos.numPeople')} *
              </label>
              <input
                type="number"
                min="1"
                max="5000"
                required
                value={form.num_people}
                onChange={(e) => setForm({ ...form, num_people: e.target.value })}
                className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-xs font-semibold block mb-1.5">
              {tr('sos.description')} *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detailed description of your immediate danger, water level, trapped location..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg p-3 text-sm focus:border-red-500 outline-none resize-none"
            />
          </div>

          {/* AI Urgency Triage Inputs */}
          <div className="p-4 bg-[#1b1b1b] rounded-xl border border-[#262626] space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🤖</span>
              <h3 className="text-white font-bold text-xs uppercase tracking-wide">
                AI Urgency Triage Factors (Evaluates Critical / High / Medium)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-gray-400 text-xs block mb-1">
                  {tr('sos.injurySeverity')}
                </label>
                <select
                  value={form.injury_severity}
                  onChange={(e) => setForm({ ...form, injury_severity: e.target.value })}
                  className="w-full bg-[#141414] border border-[#333333] text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-red-500 outline-none"
                >
                  <option value="none">No Injuries</option>
                  <option value="minor">Minor Bruises / Cuts</option>
                  <option value="moderate">Moderate Fractures / Pain</option>
                  <option value="severe">Severe Bleeding / Trauma</option>
                  <option value="critical">Critical / Unconscious</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4 sm:pt-6">
                <input
                  type="checkbox"
                  id="danger"
                  checked={form.immediate_danger}
                  onChange={(e) => setForm({ ...form, immediate_danger: e.target.checked })}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
                <label htmlFor="danger" className="text-gray-300 text-xs cursor-pointer select-none">
                  {tr('sos.immediateDanger')}
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-6">
                <input
                  type="checkbox"
                  id="medical"
                  checked={form.medical_emergency}
                  onChange={(e) => setForm({ ...form, medical_emergency: e.target.checked })}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
                <label htmlFor="medical" className="text-gray-300 text-xs cursor-pointer select-none">
                  {tr('sos.medicalEmergency')}
                </label>
              </div>
            </div>
          </div>

          {/* Location & GPS */}
          <div className="p-4 bg-[#1b1b1b] rounded-xl border border-[#262626] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-white font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                <span>📍</span>
                <span>Geolocation & Landmarks</span>
              </span>

              <button
                type="button"
                onClick={acquireGPS}
                disabled={gpsLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <span>📡</span>
                <span>{gpsLoading ? 'Acquiring GPS...' : tr('sos.getLocation')}</span>
              </button>
            </div>

            {gpsMessage.text && (
              <p
                className={`text-xs ${
                  gpsMessage.type === 'success' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {gpsMessage.text}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">
                  {tr('sos.lat')} (Manual)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="12.9716"
                  value={form.latitude ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      latitude: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full bg-[#141414] border border-[#333333] text-white rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs block mb-1">
                  {tr('sos.lng')} (Manual)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="77.5946"
                  value={form.longitude ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      longitude: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full bg-[#141414] border border-[#333333] text-white rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs block mb-1">
                  {tr('sos.locationName')}
                </label>
                <input
                  type="text"
                  placeholder="e.g., Near Bus Stand, Bengaluru"
                  value={form.location_name}
                  onChange={(e) => setForm({ ...form, location_name: e.target.value })}
                  className="w-full bg-[#141414] border border-[#333333] text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-red-500 outline-none"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* SOS Ticket Tracking Panel */}
      <TrackingPanel />

      {/* Emergency Helpline Numbers */}
      <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg">
        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
          📞 Direct Emergency Services Numbers (India)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'All Emergency (ERSS)', num: '112', icon: '🚨' },
            { label: 'State Disaster Control', num: '1077', icon: '🌊' },
            { label: 'Ambulance & Trauma', num: '108', icon: '🚑' },
            { label: 'Fire & Rescue', num: '101', icon: '🧑‍🚒' },
          ].map((item) => (
            <div
              key={item.num}
              className="p-3 bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] text-center"
            >
              <span className="text-xl mb-1 block">{item.icon}</span>
              <span className="text-white font-extrabold text-lg block">{item.num}</span>
              <span className="text-gray-400 text-[11px] block">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
