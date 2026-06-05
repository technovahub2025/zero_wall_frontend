import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const projectService = {
  async list(params = {}) {
    const response = await api.get('/projects', { params });
    const payload = unwrap(response);
    return payload.projects || payload.data?.projects || payload.data || payload || [];
  },

  async get(id) {
    const response = await api.get(`/projects/${id}`);
    const payload = unwrap(response);
    return payload.data || payload;
  },

  async create(payload) {
    const response = await api.post('/projects', payload);
    return unwrap(response);
  },

  async update(id, payload) {
    const response = await api.put(`/projects/${id}`, payload);
    return unwrap(response);
  },

  async remove(id) {
    const response = await api.delete(`/projects/${id}`);
    return unwrap(response);
  },

  async reorder(items) {
    const response = await api.put('/projects/reorder', { items });
    return unwrap(response);
  },

  async summary(id) {
    const response = await api.get(`/projects/${id}/summary`);
    return unwrap(response);
  },

  async stages(id) {
    const response = await api.get(`/projects/${id}/stages`);
    const payload = unwrap(response);
    return payload.data || payload || [];
  },

  async exportRows() {
    const response = await api.get('/projects/export/excel');
    const payload = unwrap(response);
    return payload.data || payload || [];
  },

  async kanbanOverview(params = {}) {
    const response = await api.get('/projects/kanban-overview', { params });
    const payload = unwrap(response);
    return payload.data || payload || {};
  },
};
