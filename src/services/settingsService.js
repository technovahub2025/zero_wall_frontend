import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const settingsService = {
  async getProfile() {
    const response = await api.get('/settings/profile');
    return unwrap(response);
  },
  async updateProfile(payload) {
    const response = await api.put('/settings/profile', payload);
    return unwrap(response);
  },
  async changePassword(payload) {
    const response = await api.put('/settings/password', payload);
    return unwrap(response);
  },
  async getTheme() {
    const response = await api.get('/settings/theme');
    return unwrap(response);
  },
  async updateTheme(payload) {
    const response = await api.put('/settings/theme', payload);
    return unwrap(response);
  },
  async getOrg() {
    const response = await api.get('/settings/org');
    return unwrap(response);
  },
};
