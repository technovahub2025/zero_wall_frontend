import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ? response.data : response.data;
}

export const authService = {
  async login(payload) {
    const response = await api.post('/auth/login', payload);
    return unwrap(response);
  },

  async register(payload) {
    const response = await api.post('/auth/register', payload);
    return unwrap(response);
  },

  async me(params) {
    const response = await api.get('/auth/me', { params });
    return unwrap(response);
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh-token');
    return unwrap(response);
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return unwrap(response);
  },

  async forgotPassword(payload) {
    const response = await api.post('/auth/forgot-password', payload);
    return unwrap(response);
  },

  async resetPassword(token, payload) {
    const response = await api.post(`/auth/reset-password/${token}`, payload);
    return unwrap(response);
  },

  async sendInvite(payload) {
    const response = await api.post('/auth/invite', payload);
    return unwrap(response);
  },

  async validateInvite(token) {
    const response = await api.get(`/auth/invite/${token}`);
    return unwrap(response);
  },

  async acceptInvite(token, payload) {
    const response = await api.post(`/auth/accept-invite/${token}`, payload);
    return unwrap(response);
  },
};
