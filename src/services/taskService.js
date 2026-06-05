import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const taskService = {
  async list(params = {}) {
    const response = await api.get('/tasks', { params });
    const payload = unwrap(response);
    return payload.data?.tasks || payload.tasks || payload.data || payload || [];
  },

  async mine(params = {}) {
    const response = await api.get('/tasks/mine', { params });
    const payload = unwrap(response);
    return payload.data?.tasks || payload.tasks || payload.data || payload || [];
  },

  async counts(params = {}) {
    const response = await api.get('/tasks/counts', { params });
    const payload = unwrap(response);
    return payload.data || payload || {};
  },

  async get(id) {
    const response = await api.get(`/tasks/${id}`);
    const payload = unwrap(response);
    return payload.data || payload;
  },

  async create(payload) {
    const response = await api.post('/tasks', payload);
    return unwrap(response);
  },

  async update(id, payload) {
    const response = await api.put(`/tasks/${id}`, payload);
    return unwrap(response);
  },

  async remove(id) {
    const response = await api.delete(`/tasks/${id}`);
    return unwrap(response);
  },

  async reorder(items) {
    const response = await api.put('/tasks/reorder', { items });
    return unwrap(response);
  },

  async comment(id, payload) {
    const response = await api.post(`/tasks/${id}/comments`, payload);
    return unwrap(response);
  },
};
