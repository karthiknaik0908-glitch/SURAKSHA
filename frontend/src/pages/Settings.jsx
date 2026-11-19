import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';

export default function Settings() {
  const { tr, lang, setLang, backendOnline } = useApp();
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('suraksha_api_url') || 'http://localhost:8000'
  );
  const [notifStatus, setNotifStatus] = useState('');
  const [testResult, setTestResult] = useState('');
  const [saved, setSaved] = useState(false);

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      setNotifStatus('Desktop notifications are not supported by this browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('SURAKSHA Alert System', {
        body: 'Emergency notifications successfully enabled for high priority warnings.',
        icon: '/favicon.svg',
      });
      setNotifStatus(tr('settings.notifGranted'));
    } else {
      setNotifStatus(tr('settings.notifDenied'));
    }
  };

  const handleTestAPI = async () => {
    setTestResult('Connecting to backend...');
    try {
      const res = await apiService.health();
      setTestResult(`✓ Connected! Version: ${res.data?.version} (${res.data?.status})`);
    } catch (e) {
      setTestResult(`✕ Connection Failed: ${e.message}`);
    }
  };

  const handleSave = () => {
    localStorage.setItem('suraksha_api_url', apiUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="border-b border-[#222222] pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>⚙️</span>
          <span>{tr('settings.title')}</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure multilingual interface preferences, desktop push alerts, and backend network connectivity
        </p>
      </div>

      <div className="space-y-5">
        {/* Language Selection */}
        <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <span>🌐</span>
              <span>{tr('settings.language')}</span>
            </h2>
            <span className="text-xs text-gray-500 font-mono">Active: {lang.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              { code: 'en', native: 'English', desc: 'Standard Emergency English' },
              { code: 'kn', native: 'ಕನ್ನಡ', desc: 'ಕರ್ನಾಟಕ ಅಧಿಕೃತ ಭಾಷೆ (Kannada)' },
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => setLang(item.code)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  lang === item.code
                    ? 'border-red-600 bg-red-950/30 ring-1 ring-red-600 text-white'
                    : 'border-[#222222] bg-[#1a1a1a] text-gray-400 hover:text-white hover:border-[#333333]'
                }`}
              >
                <div className="text-base font-extrabold">{item.native}</div>
                <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Configuration */}
        <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg space-y-3">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <span>🔔</span>
            <span>{tr('settings.notifications')}</span>
          </h2>
          <p className="text-gray-400 text-xs leading-relaxed">
            Permits instant visual alerts for high-priority hazard forecasts, flood warnings, and critical SOS tickets even when the browser tab is in the background.
          </p>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleEnableNotifications}
              className="px-4 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-white rounded-lg text-xs font-bold border border-[#3a3a3a] transition-colors"
            >
              🔔 {tr('settings.enableNotifications')}
            </button>
            {notifStatus && (
              <span className="text-xs text-emerald-400 font-medium">{notifStatus}</span>
            )}
          </div>
        </div>

        {/* Backend API Configuration */}
        <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <span>🔌</span>
              <span>{tr('settings.apiUrl')}</span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline ? 'bg-emerald-400' : 'bg-red-500'
                }`}
              />
              <span className="text-gray-400 font-mono">
                {backendOnline ? 'Server Active' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="flex-1 bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2 text-xs font-mono focus:border-red-500 outline-none"
            />
            <button
              onClick={handleTestAPI}
              className="px-3 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-gray-300 hover:text-white rounded-lg text-xs font-bold border border-[#333333] transition-colors"
            >
              Test Ping
            </button>
          </div>

          {testResult && (
            <p
              className={`text-xs font-mono ${
                testResult.startsWith('✓') ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {testResult}
            </p>
          )}
        </div>

        {/* System Architecture Details */}
        <div className="bg-[#141414] rounded-xl border border-[#222222] p-5 shadow-lg space-y-3">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <span>ℹ️</span>
            <span>{tr('settings.about')}</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#262626]">
              <span className="text-gray-500 block">Frontend Stack</span>
              <span className="text-white font-semibold">React 18, Vite, Tailwind CSS</span>
            </div>
            <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#262626]">
              <span className="text-gray-500 block">Backend Framework</span>
              <span className="text-white font-semibold">FastAPI + Python REST API</span>
            </div>
            <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#262626]">
              <span className="text-gray-500 block">Offline Resiliency</span>
              <span className="text-white font-semibold">IndexedDB + Service Worker</span>
            </div>
            <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#262626]">
              <span className="text-gray-500 block">AI Triage Engines</span>
              <span className="text-white font-semibold">Rule-based Flood & Landslide</span>
            </div>
            <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#262626]">
              <span className="text-gray-500 block">Geospatial Mapping</span>
              <span className="text-white font-semibold">Leaflet + OpenStreetMap</span>
            </div>
            <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#262626]">
              <span className="text-gray-500 block">Current Version</span>
              <span className="text-red-400 font-bold font-mono">1.0.0 (Hackathon MVP)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-red-950/60"
          >
            {saved ? '✓ Preferences Saved' : tr('settings.saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}
