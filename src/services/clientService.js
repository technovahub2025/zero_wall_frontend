import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const clientService = {
  async list(params = {}) {
    const response = await api.get('/clients', { params });
    const payload = unwrap(response);
    return payload.data || payload || [];
  },
  async get(id) {
    const response = await api.get(`/clients/${id}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post('/clients', payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/clients/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/clients/${id}`);
    return unwrap(response);
  },
};
