import { create } from 'zustand';
import { authService } from '../services/authService';
import { getHomePathForRole } from '../utils/roleUtils';
import { clearStoredAccessToken, getStoredAccessToken, setAuthRefreshBlocked, setStoredAccessToken } from '../lib/authToken';

const emptyState = {
  user: null,
  accessToken: getStoredAccessToken(),
  isAuthenticated: false,
  loading: true,
  initialized: false,
  initializing: false,
};

let initializePromise = null;

function normalizeUser(data) {
  return data?.user || data?.data?.user || data?.data || null;
}

function normalizeAccessToken(data) {
  return data?.accessToken || data?.data?.accessToken || null;
}

function isPublicAuthRoute() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname || '';
  return (
    path.includes('/login') ||
    path.includes('/forgot-password') ||
    path.includes('/reset-password') ||
    path.includes('/invite/')
  );
}

export const useAuthStore = create((set, get) => ({
  ...emptyState,

  initialize: async () => {
    if (get().initialized) return;
    if (initializePromise) return initializePromise;
    if (get().initializing) return;

    initializePromise = (async () => {
      const storedToken = getStoredAccessToken();
      set({ loading: true, initializing: true });

      try {
        if (!storedToken && isPublicAuthRoute()) {
          set({
            ...emptyState,
            loading: false,
            initialized: true,
            initializing: false,
          });
          return;
        }

        let currentToken = storedToken;
        let meResponse = null;

        try {
          meResponse = await authService.me();
        } catch (error) {
          if (error?.response?.status !== 401) {
            throw error;
          }

          const refreshResponse = await authService.refreshToken();
          currentToken = normalizeAccessToken(refreshResponse) || getStoredAccessToken();
          if (currentToken) {
            setStoredAccessToken(currentToken);
          }
          meResponse = await authService.me();
        }

        set({
          user: normalizeUser(meResponse),
          accessToken: normalizeAccessToken(meResponse) || currentToken || getStoredAccessToken(),
          isAuthenticated: true,
          loading: false,
          initialized: true,
          initializing: false,
        });
        return;
      } catch (error) {
        if (error?.response?.status === 401) {
          clearStoredAccessToken();
        }
      }

      set({
        ...emptyState,
        loading: false,
        initialized: true,
        initializing: false,
      });
    })().finally(() => {
      initializePromise = null;
    });

    return initializePromise;
  },

  setAuth: (payload) =>
    {
      const accessToken = normalizeAccessToken(payload);
      setStoredAccessToken(accessToken);
      setAuthRefreshBlocked(false);
      set({
        user: normalizeUser(payload),
        accessToken,
        isAuthenticated: true,
        loading: false,
        initialized: true,
      });
    },

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : state.user,
    })),

  login: async ({ identifier, password }) => {
    const response = await authService.login({ identifier, password });
    get().setAuth(response);
    return response;
  },

  register: async (payload) => {
    const response = await authService.register(payload);
    get().setAuth(response);
    return response;
  },

  acceptInvite: async (token, payload) => {
    const response = await authService.acceptInvite(token, payload);
    get().setAuth(response);
    return response;
  },

  logout: async () => {
    setAuthRefreshBlocked(true);
    clearStoredAccessToken();

    try {
      await authService.logout();
    } finally {
      set({
        ...emptyState,
        loading: false,
        initialized: true,
      });
    }
  },

  forgotPassword: authService.forgotPassword,
  resetPassword: authService.resetPassword,
  validateInvite: authService.validateInvite,
  sendInvite: authService.sendInvite,

  homePath: () => getHomePathForRole(get().user?.role),
}));
