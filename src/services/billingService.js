import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const billingService = {
  async list(params = {}) {
    const response = await api.get('/billing', { params });
    return unwrap(response);
  },
  async summary() {
    const response = await api.get('/billing/summary');
    return unwrap(response);
  },
  async byProject(projectId) {
    const response = await api.get(`/billing/project/${projectId}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post('/billing', payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/billing/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/billing/${id}`);
    return unwrap(response);
  },
};
