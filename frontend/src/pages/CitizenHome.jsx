import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import Badge from '../components/Badge';
import {
  savePendingSOSLocal,
  getPendingSOSLocal,
  markSOSSynced,
} from '../hooks/useOfflineDB';

const DISASTER_ICONS = {
  flood: '🌊', landslide: '⛰️', earthquake: '🏚️',
  cyclone: '🌀', forest_fire: '🔥', cloudburst: '⛈️',
  medical: '🚑', structural_collapse: '🏗️', other: '⚠️',
};

const EMERGENCY_TYPE_KEYS = [
  'flood','landslide','earthquake','cyclone',
  'forest_fire','cloudburst','medical','structural_collapse','other',
];

const STATUS_STEP = { pending: 1, assigned: 2, in_progress: 3, rescued: 4 };

// ─── SOS Form ────────────────────────────────────────────────────────────────

function SOSForm({ isOnline, tr, onSubmitted }) {
  const { setPendingSOSCount } = useApp();
  const [form, setForm] = useState({
    name: '', phone: '', emergency_type: 'flood', num_people: 1,
    description: '', latitude: null, longitude: null, location_name: '',
    location_status: 'unknown', location_accuracy: null, location_captured_at: null,
    injury: 'no', trapped: 'no', medical: 'no',
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMsg, setGpsMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const acquireGPS = () => {
    setGpsLoading(true);
    setGpsMsg({ type: '', text: '' });
    if (!navigator.geolocation) {
      setGpsMsg({ type: 'error', text: tr('sos.gpsNotSupported') });
      setGpsLoading(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const now = new Date().toISOString();
        setForm(f => ({
          ...f,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          location_status: 'gps',
          location_accuracy: Math.round(pos.coords.accuracy),
          location_captured_at: now,
        }));
        setGpsMsg({ type: 'success', text: tr('sos.locationCaptured') + ` ${pos.coords.latitude.toFixed(5)}°N, ${pos.coords.longitude.toFixed(5)}°E (±${Math.round(pos.coords.accuracy)}m)` });
        setGpsLoading(false);
      },
      (err) => {
        let msg = '';
        if (err.code === err.PERMISSION_DENIED) msg = tr('sos.locationPermissionDenied');
        else msg = tr('sos.locationUnavailable');
        setGpsMsg({ type: 'error', text: msg });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const injury_severity = form.injury === 'yes' ? 'severe' : form.injury === 'unsure' ? 'moderate' : 'none';
    const immediate_danger = form.trapped === 'yes';
    const medical_emergency = form.medical === 'yes';
    const payload = {
      ...form,
      num_people: parseInt(form.num_people, 10) || 1,
      injury_severity,
      immediate_danger,
      medical_emergency,
    };

    if (!isOnline) {
      try {
        const saved = await savePendingSOSLocal(payload);
        const pending = await getPendingSOSLocal();
        setPendingSOSCount(pending.length);
        onSubmitted({ offline: true, data: saved, message: tr('sos.offlineNotice') });
      } catch (err) { alert(err.message); }
      finally { setSubmitting(false); }
      return;
    }
    try {
      const res = await apiService.createSOS(payload);
      onSubmitted({ offline: false, data: res.data, message: tr('sos.sosReceivedSave') });
    } catch {
      try {
        const saved = await savePendingSOSLocal(payload);
        const pending = await getPendingSOSLocal();
        setPendingSOSCount(pending.length);
        onSubmitted({ offline: true, data: saved, message: tr('sos.serverUnreachable') });
      } catch (err) { alert(err.message); }
    } finally { setSubmitting(false); }
  };

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex justify-center py-2">
        <button type="submit" disabled={submitting}
          className="w-36 h-36 rounded-full bg-gradient-to-br from-red-600 via-red-700 to-red-900 hover:from-red-500 hover:to-red-800 text-white font-black shadow-2xl shadow-red-900/70 border-4 border-red-500/80 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 select-none disabled:opacity-50">
          <span className="text-3xl">🚨</span>
          <span className="text-sm tracking-wider">{submitting ? tr('sos.submitting') : tr('sos.submit')}</span>
          <span className="text-[9px] font-normal text-red-200">{isOnline ? tr('sos.liveBroadcast') : tr('sos.offlineSave')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-gray-300 text-xs font-semibold block mb-1">{tr('sos.name')} *</label>
          <input required type="text" placeholder={tr('sos.namePlaceholder')} value={form.name} onChange={f('name')}
            className="w-full bg-[#1c1c1c] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" />
        </div>
        <div>
          <label className="text-gray-300 text-xs font-semibold block mb-1">{tr('sos.phone')} *</label>
          <input required type="tel" placeholder="+91 9845012345" value={form.phone} onChange={f('phone')}
            className="w-full bg-[#1c1c1c] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" />
        </div>
        <div>
          <label className="text-gray-300 text-xs font-semibold block mb-1">{tr('sos.emergencyType')} *</label>
          <select value={form.emergency_type} onChange={f('emergency_type')}
            className="w-full bg-[#1c1c1c] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none">
            {EMERGENCY_TYPE_KEYS.map(t => (
              <option key={t} value={t}>{tr(`emergencyTypes.${t}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-300 text-xs font-semibold block mb-1">{tr('sos.numPeople')} *</label>
          <input required type="number" min="1" max="5000" value={form.num_people} onChange={f('num_people')}
            className="w-full bg-[#1c1c1c] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" />
        </div>
      </div>

      <div>
        <label className="text-gray-300 text-xs font-semibold block mb-1">{tr('sos.description')} *</label>
        <textarea required rows={3} placeholder={tr('sos.descriptionPlaceholder')} value={form.description} onChange={f('description')}
          className="w-full bg-[#1c1c1c] border border-[#333] text-white rounded-lg p-3 text-sm focus:border-red-500 outline-none resize-none" />
      </div>

      <div className="p-4 bg-[#1b1b1b] rounded-xl border border-[#262626] space-y-3">
        <span className="text-white font-bold text-xs uppercase tracking-wide flex items-center gap-2">{tr('sos.aiTriage')}</span>

        <div className="space-y-3">
          <div>
            <label className="text-gray-300 text-xs font-semibold block mb-1.5">{tr('sos.injuryQ')}</label>
            <div className="flex gap-2">
              {['yes', 'no', 'unsure'].map(opt => (
                <button key={opt} type="button" onClick={() => setForm(f => ({ ...f, injury: opt }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    form.injury === opt ? 'bg-red-600 text-white border-red-500' : 'bg-[#141414] text-gray-400 border-[#333] hover:text-white'
                  }`}>
                  {tr(`sos.injury${opt.charAt(0).toUpperCase() + opt.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-xs font-semibold block mb-1.5">{tr('sos.dangerQ')}</label>
            <div className="flex gap-2">
              {['yes', 'no', 'unsure'].map(opt => (
                <button key={opt} type="button" onClick={() => setForm(f => ({ ...f, trapped: opt }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    form.trapped === opt ? 'bg-red-600 text-white border-red-500' : 'bg-[#141414] text-gray-400 border-[#333] hover:text-white'
                  }`}>
                  {tr(`sos.danger${opt.charAt(0).toUpperCase() + opt.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-xs font-semibold block mb-1.5">{tr('sos.medicalQ')}</label>
            <div className="flex gap-2">
              {['yes', 'no', 'unsure'].map(opt => (
                <button key={opt} type="button" onClick={() => setForm(f => ({ ...f, medical: opt }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    form.medical === opt ? 'bg-red-600 text-white border-red-500' : 'bg-[#141414] text-gray-400 border-[#333] hover:text-white'
                  }`}>
                  {tr(`sos.medical${opt.charAt(0).toUpperCase() + opt.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-[#1b1b1b] rounded-xl border border-[#262626] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xs uppercase tracking-wide">{tr('sos.locationSection')}</span>
            {form.location_status === 'gps' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600/30 text-emerald-400 border border-emerald-600/40 font-mono">{tr('sos.locationGps')}</span>}
            {form.location_status === 'manual' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600/30 text-amber-400 border border-amber-600/40 font-mono">{tr('sos.locationManualLabel')}</span>}
            {form.location_status === 'unknown' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-600/30 text-gray-400 border border-gray-600/40 font-mono">{tr('sos.locationUnknown')}</span>}
          </div>
          <button type="button" onClick={acquireGPS} disabled={gpsLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
            📍 {gpsLoading ? tr('sos.acquiringGps') : tr('sos.shareLocation')}
          </button>
        </div>
        {gpsMsg.text && <p className={`text-xs ${gpsMsg.type === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>{gpsMsg.text}</p>}

        {form.location_status === 'gps' && form.latitude && (
          <div className="text-[11px] text-gray-400 font-mono space-y-0.5">
            <div>{tr('sos.lat')}: {form.latitude.toFixed(6)}</div>
            <div>{tr('sos.lng')}: {form.longitude.toFixed(6)}</div>
            {form.location_accuracy && <div>{tr('sos.accuracy')}: {form.location_accuracy}m</div>}
            {form.location_captured_at && <div>{tr('sos.capturedAt')}: {new Date(form.location_captured_at).toLocaleString()}</div>}
          </div>
        )}

        <div>
          <label className="text-gray-400 text-xs block mb-1">{tr('sos.locationName')}</label>
          <input type="text" placeholder={tr('sos.locationNamePlaceholder')} value={form.location_name}
            onChange={e => setForm(f => ({ ...f, location_name: e.target.value, location_status: e.target.value ? 'manual' : (form.location_status === 'gps' ? 'gps' : 'unknown') }))}
            className="w-full bg-[#141414] border border-[#333] text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-red-500 outline-none" />
        </div>
      </div>
    </form>
  );
}

// ─── Ticket Tracking ─────────────────────────────────────────────────────────

function TrackSOS({ tr }) {
  const [ticketId, setTicketId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) setTicketId(hash);
  }, []);

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true); setErr(''); setResult(null);
    try {
      const res = await apiService.trackSOS({ ticket_id: ticketId.trim(), phone: phone.trim() });
      setResult(res.data);
    } catch (e) {
      setErr(e.message.includes('404') || e.message.toLowerCase().includes('not found')
        ? tr('track.notFound') : e.message);
    } finally { setLoading(false); }
  };

  const stepLabels = [tr('track.stepPending'), tr('track.stepAssigned'), tr('track.stepInProgress'), tr('track.stepRescued')];
  const currentStep = result ? STATUS_STEP[result.status] || 1 : 0;

  return (
    <div className="space-y-5">
      <form onSubmit={handleTrack} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-gray-400 text-xs font-semibold block mb-1">{tr('track.ticketId')}</label>
          <input type="text" required placeholder={tr('track.ticketPlaceholder')} value={ticketId}
            onChange={e => setTicketId(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#333] text-white rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-gray-400 text-xs font-semibold block mb-1">{tr('track.registeredPhone')}</label>
          <input type="tel" required placeholder="+91 9845012345" value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#333] text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none" />
        </div>
        <button type="submit" disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5">
          {loading ? <><span className="animate-spin">⚙️</span>{tr('track.checking')}</> : tr('track.trackBtn')}
        </button>
      </form>

      {err && <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-start gap-2"><span>⚠️</span><span>{err}</span></div>}

      {result && (
        <div className="bg-[#0f1420] rounded-xl border border-blue-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] text-gray-400 block">{tr('track.sosTicket')}</span>
              <span className="text-white font-mono font-bold text-xs">{result.id}</span>
            </div>
            <div className="flex items-center gap-2"><Badge status={result.priority} /><Badge status={result.status} /></div>
          </div>

          <div className="flex items-center overflow-x-auto pb-1">
            {stepLabels.map((label, idx) => {
              const step = idx + 1;
              const done = step < currentStep;
              const active = step === currentStep;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center min-w-[60px]">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${done ? 'bg-emerald-600 border-emerald-500 text-white' : active ? 'bg-blue-600 border-blue-400 text-white animate-pulse' : 'bg-[#1a1a1a] border-[#333] text-gray-500'}`}>
                      {done ? '✓' : step}
                    </div>
                    <span className={`text-[9px] mt-1 font-medium text-center ${active ? 'text-blue-400' : done ? 'text-emerald-400' : 'text-gray-500'}`}>{label}</span>
                  </div>
                  {idx < stepLabels.length - 1 && <div className={`flex-1 h-0.5 mx-1 rounded ${step < currentStep ? 'bg-emerald-600' : 'bg-[#2a2a2a]'}`} />}
                </React.Fragment>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              [tr('track.name'), result.name],
              [tr('track.type'), result.emergency_type],
              [tr('track.people'), result.num_people],
              [tr('track.submitted'), new Date(result.created_at).toLocaleString()],
            ].map(([k, v]) => (
              <div key={k} className="p-2.5 bg-[#141414] rounded-lg border border-[#222]">
                <span className="text-gray-400 block text-[10px]">{k}</span>
                <span className="text-white font-semibold capitalize">{v}</span>
              </div>
            ))}
          </div>

          {result.location_name && (
            <div className="p-2.5 bg-[#141414] rounded-lg border border-[#222] text-xs">
              <span className="text-gray-400 block text-[10px]">{tr('track.location')}</span>
              <span className="text-white font-semibold">📍 {result.location_name}</span>
            </div>
          )}

          {result.assigned_team && (
            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800 text-xs space-y-1">
              <span className="text-emerald-400 font-bold block">{tr('track.rescueTeamAssigned')}</span>
              <span className="text-white font-semibold">{result.assigned_team.name}</span>
              <span className="text-gray-300 block">📞 {result.assigned_team.contact}</span>
            </div>
          )}

          <p className="text-gray-500 text-[10px] flex items-center gap-1.5">{tr('track.privacyNote')}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main CitizenHome ────────────────────────────────────────────────────────

export default function CitizenHome() {
  const { lang, setLang, isOnline, tr } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('sos');
  const [submittedSOS, setSubmittedSOS] = useState(null);
  const [pendingList, setPendingList] = useState([]);
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    apiService.fetchAlerts()
      .then(r => setAlerts(r.data || []))
      .catch(() => {})
      .finally(() => setAlertsLoading(false));
  }, []);

  useEffect(() => {
    getPendingSOSLocal().then(setPendingList).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    (async () => {
      const pending = await getPendingSOSLocal();
      if (pending.length === 0) return;
      setSyncStatus(`${tr('sos.pendingOffline')}: ${pending.length} ${tr('citizen.syncingMsg')}`);
      for (const p of pending) {
        try {
          const { local_id, synced, created_at_local, ...payload } = p;
          const res = await apiService.createSOS(payload);
          await markSOSSynced(local_id, res.data?.id);
        } catch {}
      }
      const remaining = await getPendingSOSLocal();
      setPendingList(remaining);
      setSyncStatus(tr('citizen.syncedMsg'));
      setTimeout(() => setSyncStatus(''), 4000);
    })();
  }, [isOnline]);

  const handleSOSSubmitted = async (result) => {
    setSubmittedSOS(result);
    const pending = await getPendingSOSLocal();
    setPendingList(pending);
    setActiveSection('sos');
  };

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedAlerts = [...alerts].sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  const NAV_TABS = [
    { id: 'sos',    label: tr('citizen.tabSOS') },
    { id: 'track',  label: tr('citizen.tabTrack') },
    { id: 'alerts', label: `${tr('citizen.tabAlerts')}${alerts.length ? ` (${alerts.length})` : ''}` },
    { id: 'safety', label: tr('citizen.tabSafety') },
  ];

  const SAFETY_KEYS = ['flood', 'landslide', 'earthquake', 'cyclone', 'forest_fire', 'cloudburst'];

  const HELPLINES = [
    { num: '112', labelKey: 'citizen.allEmergency', icon: '🚨' },
    { num: '1077', labelKey: 'citizen.disasterControl', icon: '🌊' },
    { num: '108', labelKey: 'citizen.ambulance', icon: '🚑' },
    { num: '101', labelKey: 'citizen.fireRescue', icon: '🧑‍🚒' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111111] border-b border-[#222222] px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-black text-white text-base shadow-md shadow-red-900/40 flex-shrink-0">S</div>
          <div>
            <span className="text-white font-extrabold text-base tracking-wider">{tr('appName')}</span>
            <span className="hidden sm:inline text-gray-400 text-xs ml-2">— {tr('disasterEmergencyNetwork')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${isOnline ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-red-950/80 text-red-300 border-red-700 animate-pulse'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-500'}`} />
            {isOnline ? tr('onlineStatus') : tr('offlineStatus')}
          </span>
          <div className="flex gap-1 bg-[#1a1a1a] p-0.5 rounded-lg border border-[#2a2a2a]">
            <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${lang === 'en' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>EN</button>
            <button onClick={() => setLang('kn')} className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${lang === 'kn' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>ಕನ್ನಡ</button>
          </div>
          <Link to="/rescue-login" className="hidden sm:flex items-center gap-1.5 bg-[#1c1c1c] hover:bg-[#282828] border border-[#444] text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
            {tr('rescueLogin')}
          </Link>
        </div>
      </header>

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-red-950/70 border-b border-red-800 px-4 py-2.5 flex items-center gap-2 text-sm text-red-200">
          <span>⚠️</span>
          <span className="font-semibold">{tr('offlineModeBanner')}</span>
          <span className="text-xs">{tr('sos.offlineNotice')}</span>
        </div>
      )}
      {syncStatus && (
        <div className="bg-emerald-950/80 border-b border-emerald-700 px-4 py-2 flex items-center gap-2 text-xs text-emerald-300">
          <span className="animate-spin">🔄</span> {syncStatus}
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-b from-[#0d0d0d] to-[#0a0a0a] border-b border-[#1a1a1a] px-4 sm:px-6 py-8 sm:py-10 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex justify-center">
            <span className="bg-red-950/80 text-red-400 border border-red-800 text-xs px-3 py-1 rounded-full font-bold tracking-wider">
              {tr('emergencyResponse24')}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {tr('appName')} — {tr('tagline')}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">{tr('citizen.heroSubtitle')}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {HELPLINES.map(h => (
              <div key={h.num} className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-center">
                <span className="text-red-400 font-extrabold text-base block leading-tight">{h.num}</span>
                <span className="text-gray-400 text-[10px]">{tr(h.labelKey)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offline pending */}
      {pendingList.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-[#141414] rounded-xl border border-amber-800/80 p-4 space-y-2">
            <h3 className="text-amber-400 font-bold text-xs flex items-center gap-2">⏳ {tr('sos.pendingOffline')} ({pendingList.length})</h3>
            {pendingList.map(p => (
              <div key={p.local_id} className="flex items-center justify-between p-2.5 bg-[#1c1c1c] rounded-lg border border-[#2a2a2a] text-xs">
                <div>
                  <span className="font-bold text-white">{p.name}</span>
                  <span className="text-gray-400 ml-2">({p.emergency_type})</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800 text-[10px] font-mono">{tr('sos.offlineSaved')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 bg-[#111] p-1 rounded-xl border border-[#222]">
          {NAV_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${activeSection === tab.id ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* SOS tab */}
        {activeSection === 'sos' && (
          <div className="space-y-5">
            {submittedSOS ? (
              <div className={`p-6 rounded-xl border shadow-xl space-y-4 ${submittedSOS.offline ? 'bg-[#18120a] border-amber-700' : 'bg-[#0f1d14] border-emerald-700'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{submittedSOS.offline ? '📱' : '✅'}</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {submittedSOS.offline ? tr('sosSavedOffline') : tr('sosTransmitted')}
                    </h2>
                    <p className="text-xs text-gray-300 mt-0.5">{submittedSOS.message}</p>
                  </div>
                </div>
                <div className="p-4 bg-black/50 rounded-xl border border-white/10 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-white/10">
                    <span className="text-gray-400">{tr('sos.sosId')}:</span>
                    <span className="font-mono font-bold text-white text-sm select-all">
                      {submittedSOS.data?.id || submittedSOS.data?.local_id}
                    </span>
                  </div>
                  {!submittedSOS.offline && (
                    <>
                      <div className="flex justify-between items-center py-1 border-b border-white/10">
                        <span className="text-gray-400">{tr('sos.aiTriagePriority')}</span>
                        <Badge status={submittedSOS.data?.priority} />
                      </div>
                      {submittedSOS.data?.priority_reasons?.length > 0 && (
                        <div className="pt-1">
                          <span className="text-gray-400 block mb-1">{tr('sos.classificationFactors')}</span>
                          <ul className="list-disc list-inside text-gray-300 text-[11px] space-y-0.5">
                            {submittedSOS.data.priority_reasons.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                  <div className="pt-1 text-[11px] text-amber-300 font-semibold">{tr('saveTicketWarning')}</div>
                  <p className="text-[11px] text-gray-400">{tr('sos.instructions')}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSubmittedSOS(null)}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors">
                    {tr('submitAnotherSOS')}
                  </button>
                  <button onClick={() => setActiveSection('track')}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors">
                    {tr('trackThisSOS')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#141414] rounded-xl border border-[#222] p-6 shadow-xl">
                <div className="flex items-center gap-2 pb-4 border-b border-[#222] mb-5">
                  <span className="text-red-500 animate-pulse text-xl">🆘</span>
                  <div>
                    <h2 className="text-white font-bold text-base">{tr('sos.title')}</h2>
                    <p className="text-gray-400 text-xs">{tr('sos.subtitle')}</p>
                  </div>
                </div>
                <SOSForm isOnline={isOnline} tr={tr} onSubmitted={handleSOSSubmitted} />
              </div>
            )}
          </div>
        )}

        {/* Track tab */}
        {activeSection === 'track' && (
          <div className="bg-[#141414] rounded-xl border border-[#222] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
              <span className="text-xl">🔍</span>
              <div>
                <h2 className="text-white font-bold text-base">{tr('track.title')}</h2>
                <p className="text-gray-400 text-xs">{tr('track.subtitle')}</p>
              </div>
            </div>
            <TrackSOS tr={tr} />
          </div>
        )}

        {/* Alerts tab */}
        {activeSection === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-base flex items-center gap-2">🔔 {tr('citizen.activeAlerts')}</h2>
              <span className="text-gray-500 text-xs">{sortedAlerts.length} {tr('citizen.activeCount')}</span>
            </div>
            {alertsLoading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-[#141414] rounded-xl animate-pulse" />)}</div>
            ) : sortedAlerts.length === 0 ? (
              <div className="bg-[#141414] rounded-xl border border-[#222] p-10 text-center text-gray-500 text-sm">{tr('alerts.noAlerts')}</div>
            ) : (
              sortedAlerts.map(alert => (
                <div key={alert.id} className="p-5 bg-[#141414] rounded-xl border border-[#262626] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 bg-black/40 rounded-xl">{DISASTER_ICONS[alert.disaster_type] || '⚠️'}</span>
                      <div>
                        <h3 className="text-white font-bold text-sm">{alert.location}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge status={alert.disaster_type} />
                          <Badge status={alert.severity} />
                          <Badge status={alert.source} />
                          {alert.notes?.includes('DEMO') && <span className="text-blue-400 text-[10px] font-mono bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/50">{tr('demoData')}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-500 text-[10px] font-mono">{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed pl-0 sm:pl-14">{alert.description}</p>
                  {alert.safety_actions?.length > 0 && (
                    <div className="pl-0 sm:pl-14 pt-2 border-t border-[#222]">
                      <span className="text-gray-400 text-xs font-semibold block mb-1.5">{tr('alerts.safetyActionsLabel')}</span>
                      <div className="flex flex-wrap gap-2">
                        {alert.safety_actions.map((act, i) => (
                          <span key={i} className="bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">✓ {act}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div className="bg-[#141414] rounded-xl border border-[#222] p-4 text-xs text-gray-400">
              <strong className="text-amber-400">{tr('common.demo')}:</strong> {tr('citizen.alertsNote')}
            </div>
          </div>
        )}

        {/* Safety tab */}
        {activeSection === 'safety' && (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-base">{tr('citizen.safetyGuideTitle')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SAFETY_KEYS.map(key => {
                const icon = DISASTER_ICONS[key] || '⚠️';
                const title = tr(`safety.${key}.title`);
                const tips = [0,1,2,3].map(i => tr(`safety.${key}.tips.${i}`)).filter(t => t && !t.startsWith('safety.'));
                return (
                  <div key={key} className="bg-[#141414] rounded-xl border border-[#222] p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{icon}</span>
                      <h3 className="text-white font-bold text-sm">{title}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <div className="bg-[#141414] rounded-xl border border-[#222] p-5 space-y-3">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">{tr('citizen.emergencyHelplines')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {HELPLINES.map(h => (
                  <div key={h.num} className="p-3 bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] text-center">
                    <span className="text-xl mb-1 block">{h.icon}</span>
                    <span className="text-white font-extrabold text-lg block">{h.num}</span>
                    <span className="text-gray-400 text-[10px] block">{tr(h.labelKey)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] px-4 sm:px-6 py-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/rescue-login"
            className="bg-[#1c1c1c] hover:bg-[#282828] border border-[#444] text-gray-300 hover:text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
            {tr('citizen.rescueLoginBtn')}
          </Link>
        </div>
        <p className="text-gray-600 text-[11px]">{tr('citizen.footerNote')}</p>
      </footer>
    </div>
  );
}
