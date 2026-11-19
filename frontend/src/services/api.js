import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const api = axios.create({
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject auth token from localStorage into every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('suraksha_rescue_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    // Auto-clear invalid/expired tokens
    if (err.response?.status === 401) {
      const token = localStorage.getItem('suraksha_rescue_token');
      if (token) {
        localStorage.removeItem('suraksha_rescue_token');
        localStorage.removeItem('suraksha_rescue_user');
        window.dispatchEvent(new CustomEvent('suraksha_logout'));
      }
    }
    const errorMsg =
      err.response?.data?.detail?.message ||
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Network or Server Error';
    return Promise.reject(new Error(errorMsg));
  }
);

export const apiService = {
  // Auth
  login: (credentials) => api.post(API_ENDPOINTS.login, credentials),
  logout: () => api.post(API_ENDPOINTS.logout),
  getProfile: () => api.get(API_ENDPOINTS.profile),

  // Public
  health: () => api.get(API_ENDPOINTS.health),
  fetchStats: () => api.get(API_ENDPOINTS.stats),
  fetchAlerts: () => api.get(API_ENDPOINTS.alerts),
  createSOS: (data) => api.post(API_ENDPOINTS.sos, data),
  trackSOS: (data) => api.post(API_ENDPOINTS.sosTrack, data),
  assessDisasterRisk: (data) => api.post(API_ENDPOINTS.disasterRisk, data),
  fetchMapPoints: () => api.get(API_ENDPOINTS.mapPoints),

  // Protected (rescue personnel only)
  createAlert: (data) => api.post(API_ENDPOINTS.alerts, data),
  fetchSOS: () => api.get(API_ENDPOINTS.sos),
  updateSOSStatus: (id, data) => api.patch(`${API_ENDPOINTS.sos}/${id}`, data),
  fetchRescueTeams: () => api.get(API_ENDPOINTS.rescueTeams),
  createRescueTeam: (data) => api.post(API_ENDPOINTS.rescueTeams, data),
  updateRescueTeam: (id, data) => api.patch(`${API_ENDPOINTS.rescueTeams}/${id}`, data),
  fetchResources: () => api.get(API_ENDPOINTS.resources),
  createResource: (data) => api.post(API_ENDPOINTS.resources, data),
  updateResource: (id, data) => api.patch(`${API_ENDPOINTS.resources}/${id}`, data),
  deleteResource: (id) => api.delete(`${API_ENDPOINTS.resources}/${id}`),
};
