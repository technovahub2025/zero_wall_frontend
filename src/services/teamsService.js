import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const teamsService = {
  async list(params = {}) {
    const response = await api.get('/teams', { params });
    const payload = unwrap(response);
    return payload.data || payload || [];
  },
  async get(id) {
    const response = await api.get(`/teams/${id}`);
    const payload = unwrap(response);
    return payload.data || payload || null;
  },
  async create(payload) {
    const response = await api.post('/teams', payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/teams/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/teams/${id}`);
    return unwrap(response);
  },
  async addMembers(id, payload) {
    const response = await api.post(`/teams/${id}/members`, payload);
    return unwrap(response);
  },
  async removeMember(id, memberId) {
    const response = await api.delete(`/teams/${id}/members/${memberId}`);
    return unwrap(response);
  },
};
