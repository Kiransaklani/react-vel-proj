// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  PROFILE: `${API_BASE_URL}/profile`,

  // App
  ANALYZE: `${API_BASE_URL}/analyze`,
  ANALYSES: `${API_BASE_URL}/analyses`,
  ANALYSIS_STATUS: (id) => `${API_BASE_URL}/analyses/${id}/status`,
  DASHBOARD_SUMMARY: `${API_BASE_URL}/dashboard-summary`,
  REPORTS: `${API_BASE_URL}/reports`,
  API_USAGE: `${API_BASE_URL}/api-usage`,

};

export default API_BASE_URL;
