import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';

const NAV_ITEMS = [
  { path: '/', label: 'nav.overview', icon: '📊' },
  { path: '/disaster-monitoring', label: 'nav.disasterMonitoring', icon: '🌊' },
  { path: '/risk-assessment', label: 'nav.riskAssessment', icon: '🔬' },
  { path: '/emergency-sos', label: 'nav.emergencySOS', icon: '🆘' },
  { path: '/live-rescue-map', label: 'nav.liveRescueMap', icon: '🗺️' },
  { path: '/rescue-management', label: 'nav.rescueManagement', icon: '🚁', requiresAuth: true },
  { path: '/resource-management', label: 'nav.resourceManagement', icon: '📦', requiresAuth: true },
  { path: '/alerts', label: 'nav.alerts', icon: '🔔' },
  { path: '/settings', label: 'nav.settings', icon: '⚙️' },
];

export default function Layout() {
  const { tr, isOnline, lang, setLang, pendingSOSCount, backendOnline, setBackendOnline, isRescueAuthenticated, rescueUser, setRescueUser } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  useEffect(() => {
    let mounted = true;
    const checkBackend = async () => {
      try {
        await apiService.health();
        if (mounted) setBackendOnline(true);
      } catch {
        if (mounted) setBackendOnline(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setBackendOnline]);

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch {
      // Ignore logout errors, still clear local state
    }
    setRescueUser(null);
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
          ${sidebarOpen ? 'w-64' : isMobile ? '-translate-x-full w-64' : 'w-20'}
          h-full bg-[#111111] border-r border-[#222222] flex flex-col transition-all duration-300 ease-in-out select-none
        `}
      >
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#222222] min-h-[64px] bg-[#0d0d0d]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-black text-white text-lg shadow-md shadow-red-900/40 flex-shrink-0">
            S
          </div>
          {(sidebarOpen || isMobile) && (
            <div className="overflow-hidden">
              <div className="text-white font-extrabold text-base tracking-wider flex items-center gap-1.5">
                SURAKSHA
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600/30 text-red-400 border border-red-600/40 font-mono">
                  MVP
                </span>
              </div>
              <div className="text-gray-400 text-xs truncate">Disaster & Rescue Net</div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-950/50'
                    : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'
                }`
              }
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {(sidebarOpen || isMobile) && (
                <span className="truncate flex-1">{tr(item.label)}</span>
              )}
              {(sidebarOpen || isMobile) && item.requiresAuth && !isRescueAuthenticated && (
                <span className="text-gray-500 text-xs">🔒</span>
              )}
            </NavLink>
          ))}

          {/* Rescue Login / Logout nav entry */}
          {(sidebarOpen || isMobile) && (
            <div className="pt-2 mt-2 border-t border-[#1e1e1e]">
              {isRescueAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-all text-left"
                >
                  <span className="text-lg">🚪</span>
                  <div className="min-w-0">
                    <span className="block truncate">Logout Rescue</span>
                    <span className="text-gray-500 text-[10px] truncate">{rescueUser?.name}</span>
                  </div>
                </button>
              ) : (
                <NavLink
                  to="/rescue-login"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-red-600 text-white font-semibold'
                        : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                    }`
                  }
                >
                  <span className="text-lg">🔐</span>
                  <span>Rescue Team Login</span>
                </NavLink>
              )}
            </div>
          )}
        </nav>

        {/* Quick Language Switcher & Hotline */}
        <div className="p-3 border-t border-[#222222] bg-[#0d0d0d] space-y-2">
          {(sidebarOpen || isMobile) ? (
            <>
              <div className="flex gap-1.5 bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a]">
                <button
                  onClick={() => setLang('en')}
                  className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                    lang === 'en' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLang('kn')}
                  className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                    lang === 'kn' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ಕನ್ನಡ
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 px-1 pt-1">
                <span>National SOS:</span>
                <span className="font-bold text-red-400">🚨 112 / 1077</span>
              </div>
            </>
          ) : (
            <button
              onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
              className="w-full py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-xs font-bold rounded text-gray-300 text-center"
              title="Toggle Language (EN / KN)"
            >
              {lang === 'en' ? 'ಕನ್ನ' : 'EN'}
            </button>
          )}
        </div>
      </aside>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#111111] border-b border-[#222222] flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-[#1f1f1f] transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <span className="text-white font-bold tracking-wider text-sm sm:text-base">
                {tr('appName')}
              </span>
              <span className="text-gray-400 text-xs hidden md:inline ml-2">
                — {tr('tagline')}
              </span>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            {pendingSOSCount > 0 && (
              <NavLink
                to="/emergency-sos"
                className="bg-amber-600/30 text-amber-300 border border-amber-500 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-pulse"
              >
                <span>⚠️</span>
                <span>{pendingSOSCount} Offline SOS</span>
              </NavLink>
            )}

            {/* Rescue user badge */}
            {isRescueAuthenticated && rescueUser && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border bg-blue-950/60 text-blue-300 border-blue-800">
                <span>🚁</span>
                <span>{rescueUser.name?.split(' ')[0]}</span>
              </div>
            )}

            {/* Network / Offline Pill */}
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                isOnline
                  ? backendOnline === false
                    ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : 'bg-red-950/80 text-red-300 border-red-700 animate-pulse'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline
                    ? backendOnline === false
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                    : 'bg-red-500'
                }`}
              />
              <span className="hidden xs:inline">
                {!isOnline
                  ? 'Offline Mode'
                  : backendOnline === false
                  ? 'Server Offline'
                  : 'System Connected'}
              </span>
            </div>

            {/* Emergency SOS Quick Button */}
            <NavLink
              to="/emergency-sos"
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-red-900/40 transition-colors"
            >
              <span>🆘</span>
              <span className="hidden sm:inline">SOS</span>
            </NavLink>
          </div>
        </header>

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
