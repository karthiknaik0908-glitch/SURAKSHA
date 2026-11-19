import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './contexts/AppContext';

// ── Citizen portal (public, no auth) ──────────────────────────────────────────
import CitizenHome from './pages/CitizenHome';

// ── Rescue portal ──────────────────────────────────────────────────────────────
import RescueLogin     from './pages/RescueLogin';
import RescueLayout    from './components/RescueLayout';
import RescueDashboard from './pages/RescueDashboard';

// ── Rescue sub-pages (all reused as-is) ────────────────────────────────────────
import DisasterMonitoring from './pages/DisasterMonitoring';
import RiskAssessment     from './pages/RiskAssessment';
import RescueManagement   from './pages/RescueManagement';
import ResourceManagement from './pages/ResourceManagement';
import LiveRescueMap      from './pages/LiveRescueMap';
import Alerts             from './pages/Alerts';
import Settings           from './pages/Settings';

// Guard: redirect unauthenticated users away from rescue portal
function RequireRescueAuth({ children }) {
  const { isRescueAuthenticated } = useApp();
  if (!isRescueAuthenticated) {
    return <Navigate to="/rescue-login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ── PORTAL 1: Public Citizen Home (/) ── */}
      <Route path="/" element={<CitizenHome />} />

      {/* ── Rescue Team Login (standalone, no layout) ── */}
      <Route path="/rescue-login" element={<RescueLogin />} />

      {/* ── PORTAL 2: Protected Rescue Dashboard (/rescue-dashboard/*) ── */}
      <Route
        path="/rescue-dashboard"
        element={
          <RequireRescueAuth>
            <RescueLayout />
          </RequireRescueAuth>
        }
      >
        {/* Index = command center overview */}
        <Route index element={<RescueDashboard />} />

        {/* All rescue sub-pages nested under /rescue-dashboard/ */}
        <Route path="disaster-monitoring"  element={<DisasterMonitoring />} />
        <Route path="risk-assessment"      element={<RiskAssessment />} />
        <Route path="rescue-management"    element={<RescueManagement />} />
        <Route path="resource-management"  element={<ResourceManagement />} />
        <Route path="live-rescue-map"      element={<LiveRescueMap />} />
        <Route path="alerts"               element={<Alerts />} />
        <Route path="settings"             element={<Settings />} />
      </Route>

      {/* ── Catch-all: redirect to citizen home ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
