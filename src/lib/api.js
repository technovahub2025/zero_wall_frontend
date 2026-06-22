import axios from 'axios';
import { clearStoredAccessToken, getStoredAccessToken, setStoredAccessToken } from './authToken';

function resolveApiBaseUrl() {
  const explicit = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  if (explicit) return explicit;

  if (typeof window !== 'undefined' && window.location?.origin) {
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
  return config;
});

async function refreshAccessToken() {
  if (!getStoredAccessToken()) {
    clearStoredAccessToken();
    return null;
  }

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

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh ||
      !getStoredAccessToken()
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
      return Promise.reject(error);
    }
  },
);
