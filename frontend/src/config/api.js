const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  health: `${API_BASE}/api/health`,
  disasterRisk: `${API_BASE}/api/disaster-risk`,
  alerts: `${API_BASE}/api/alerts`,
  sos: `${API_BASE}/api/sos`,
  sosTrack: `${API_BASE}/api/sos/track`,
  rescueTeams: `${API_BASE}/api/rescue-teams`,
  resources: `${API_BASE}/api/resources`,
  stats: `${API_BASE}/api/dashboard/stats`,
  mapPoints: `${API_BASE}/api/map-points`,
  login: `${API_BASE}/api/auth/login`,
  logout: `${API_BASE}/api/auth/logout`,
  profile: `${API_BASE}/api/auth/me`,
};

export default API_BASE;
