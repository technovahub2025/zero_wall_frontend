import axios from 'axios';
import { clearStoredAccessToken, getStoredAccessToken, isAuthRefreshBlocked, setStoredAccessToken } from './authToken';

function resolveApiBaseUrl() {
  const explicit = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  if (explicit) return explicit;

  if (typeof window !== 'undefined' && window.location?.origin) {
    if (/^https:\/\/([a-z0-9-]+\.)?technovahub\.in$/i.test(window.location.origin)) {
      return 'https://pg-infra-backend.onrender.com/api';
    }
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(window.location.origin)) {
      return 'http://localhost:5000/api';
    }
    return `${window.location.origin}/api`;
  }

  return 'http://localhost:5000/api';
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});

let refreshPromise = null;
const CSRF_COOKIE = 'pg-csrf-token';

const NON_REFRESHABLE_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/accept-invite',
  '/auth/invite',
  '/auth/refresh-token',
  '/auth/logout',
];

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (typeof document !== 'undefined') {
    const csrfToken = document.cookie
      .split('; ')
      .find((item) => item.startsWith(`${CSRF_COOKIE}=`))
      ?.split('=')
      .slice(1)
      .join('=');

    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return config;
});

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/refresh-token')
      .then((response) => {
        const token = response.data?.accessToken || response.data?.data?.accessToken || null;
        if (token) {
          setStoredAccessToken(token);
        }
        return token;
      })
      .catch((error) => {
        clearStoredAccessToken();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const requestUrl = originalRequest?.url || '';
    const shouldSkipRefresh = NON_REFRESHABLE_PATHS.some((path) => requestUrl.includes(path));
    const hasStoredToken = Boolean(getStoredAccessToken());

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh ||
      isAuthRefreshBlocked() ||
      !hasStoredToken ||
      (requestUrl && requestUrl.includes('/auth/refresh-token'))
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const token = await refreshAccessToken();
      if (!token) {
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearStoredAccessToken();
      return Promise.reject(error);
    }
  },
);
