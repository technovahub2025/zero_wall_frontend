import { create } from 'zustand';
import { authService } from '../services/authService';
import { getHomePathForRole } from '../utils/roleUtils';
import { clearStoredAccessToken, getStoredAccessToken, setStoredAccessToken } from '../lib/authToken';

const emptyState = {
  user: null,
  accessToken: getStoredAccessToken(),
  isAuthenticated: false,
  loading: true,
  initialized: false,
  initializing: false,
};

function normalizeUser(data) {
  return data?.user || data?.data?.user || data?.data || null;
}

function normalizeAccessToken(data) {
  return data?.accessToken || data?.data?.accessToken || null;
}

export const useAuthStore = create((set, get) => ({
  ...emptyState,

  initialize: async () => {
    if (get().initialized || get().initializing) return;

    const storedToken = getStoredAccessToken();
    set({ loading: true, initializing: true });

    try {
      let currentToken = storedToken;
      if (!currentToken) {
        const refreshResponse = await authService.refreshToken();
        currentToken = normalizeAccessToken(refreshResponse) || getStoredAccessToken();
        if (currentToken) {
          setStoredAccessToken(currentToken);
        }
      }

      const meResponse = await authService.me();
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
  },

  setAuth: (payload) =>
    {
      const accessToken = normalizeAccessToken(payload);
      setStoredAccessToken(accessToken);
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
    try {
      await authService.logout();
    } finally {
      clearStoredAccessToken();
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
