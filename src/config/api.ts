/**
 * API Configuration
 * Centralized configuration for all API endpoints and base URLs
 */

// Get the base URL from environment variable with fallback
export const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_PROD_API_URL!;

// Clean the base URL (remove trailing slash)
export const CLEAN_API_BASE_URL = API_BASE_URL.replace(/\/$/, '');

// API endpoints with proper prefix
export const API_PREFIXED_BASE = CLEAN_API_BASE_URL.endsWith('/api') 
  ? CLEAN_API_BASE_URL 
  : `${CLEAN_API_BASE_URL}/api`;

// WebSocket configuration
export const WS_BASE_URL = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

// Common API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/user/admin/login/',
  LOGOUT: '/api/auth/logout/',
  REFRESH_TOKEN: '/api/token/refresh/',
  
  // Admin Activity
  ADMIN_ACTIVITY: '/api/admin/activity/',
  
  // Users
  USERS: '/api/admin/users/',
  USER_SUSPEND: (userId: number) => `/api/admin/users/${userId}/suspend/`,
  USER_ACTIVATE: (userId: number) => `/api/admin/users/${userId}/activate/`,
  
  // Vendors
  VENDORS: '/api/admin/vendors/',
  VENDOR_SUSPEND: (vendorId: number) => `/api/admin/users/vendor/${vendorId}/suspend/`,
  VENDOR_ACTIVATE: (vendorId: number) => `/api/admin/users/vendor/${vendorId}/activate/`,
  
  // Couriers
  COURIERS: '/api/admin/couriers/',
  COURIER_SUSPEND: (courierId: number) => `/api/admin/users/courier/${courierId}/suspend/`,
  COURIER_ACTIVATE: (courierId: number) => `/api/admin/users/courier/${courierId}/activate/`,
  
  // Analytics
  REVENUE_ANALYTICS: '/api/admin/revenue/analytics/',
  REVENUE_CHART: '/api/admin/revenue/chart/',
  DASHBOARD_STATS: '/api/admin/dashboard/stats/',
  REVENUE_BREAKDOWN: '/api/admin/revenue/breakdown/',
  
  // Verification
  VERIFICATION_PENDING: '/api/admin/verification/pending/',
  
  // Suspended Users
  SUSPENDED_USERS: '/api/admin/users/suspended/',

  // System Settings
  SETTINGS: '/user/admin/settings/',
  SETTINGS_DETAIL: (key: string) => `/user/admin/settings/${key}/`,
} as const;

// WebSocket endpoints
export const WS_ENDPOINTS = {
  ADMIN_ACTIVITY: '/ws/admin/activity/',
  ADMIN_ACTIVITY_ALT: '/admin/activity/', // Alternative endpoint for compatibility
} as const;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  const base = CLEAN_API_BASE_URL.endsWith('/') 
    ? CLEAN_API_BASE_URL.slice(0, -1) 
    : CLEAN_API_BASE_URL;
  return `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

// Helper function to get WebSocket URL
export const getWsUrl = (endpoint: string, token: string): string => {
  return `${WS_BASE_URL}${endpoint}?token=${token}`;
};

// Debug logging
export const logApiConfig = () => {
  console.log('=== API Configuration ===');
  console.log('Environment REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('CLEAN_API_BASE_URL:', CLEAN_API_BASE_URL);
  console.log('API_PREFIXED_BASE:', API_PREFIXED_BASE);
  console.log('WS_BASE_URL:', WS_BASE_URL);
  console.log('========================');
};

