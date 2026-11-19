import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';

export default function RescueLogin() {
  const { setRescueUser, tr, lang, setLang } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiService.login({ username: form.username.trim(), password: form.password });
      const { token, user } = res.data;
      localStorage.setItem('suraksha_rescue_token', token);
      setRescueUser(user);
      navigate('/rescue-dashboard');
    } catch (err) {
      setError(err.message || tr('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Language toggle */}
        <div className="flex justify-end">
          <div className="flex gap-1 bg-[#1a1a1a] p-0.5 rounded-lg border border-[#2a2a2a]">
            <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${lang === 'en' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>EN</button>
            <button onClick={() => setLang('kn')} className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${lang === 'kn' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>ಕನ್ನಡ</button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-black text-white text-3xl shadow-xl shadow-red-900/50 mx-auto">S</div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{tr('login.portalTitle')}</h1>
          <p className="text-gray-400 text-sm">{tr('login.portalDesc')}</p>
        </div>

        {/* Login card */}
        <div className="bg-[#141414] rounded-2xl border border-[#222222] p-7 shadow-2xl space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-[#222222]">
            <span className="text-xl">🔐</span>
            <h2 className="text-white font-bold text-base">{tr('login.secureLogin')}</h2>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-sm flex items-center gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1.5">{tr('login.username')}</label>
              <input type="text" required autoComplete="username" placeholder={tr('login.usernamePlaceholder')}
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-500 outline-none" />
            </div>
            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1.5">{tr('login.password')}</label>
              <input type="password" required autoComplete="current-password" placeholder={tr('login.passwordPlaceholder')}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[#1c1c1c] border border-[#333333] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-500 outline-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-2">
              {loading ? (
                <><span className="animate-spin">⚙️</span><span>{tr('login.authenticating')}</span></>
              ) : (
                <><span>🚁</span><span>{tr('login.loginBtn')}</span></>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-xs space-y-1.5">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <span>ℹ️</span><span>{tr('login.demoTitle')}</span>
            </span>
            <div className="text-gray-300 font-mono space-y-1 pl-5">
              <div>{tr('login.demoRescue')} <strong>rescue</strong> / <strong>rescue112</strong></div>
              <div>{tr('login.demoAdmin')} <strong>admin</strong> / <strong>admin112</strong></div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a href="/" className="text-gray-400 hover:text-white text-xs underline underline-offset-2 transition-colors">
            {tr('login.backToCitizen')}
          </a>
        </div>

        <p className="text-center text-gray-600 text-[11px] leading-relaxed">
          {tr('login.securityNotice')}<br />{tr('login.actionsAttributed')}
        </p>
      </div>
    </div>
  );
}
