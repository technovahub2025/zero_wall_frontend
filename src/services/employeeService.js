import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const employeeService = {
  async list(params) {
    const response = await api.get('/employees', { params });
    return unwrap(response);
  },
  async get(id) {
    const response = await api.get(`/employees/${id}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post('/employees', payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/employees/${id}`, payload);
    return unwrap(response);
  },
  async updateRole(id, payload) {
    const response = await api.put(`/employees/${id}/role`, payload);
    return unwrap(response);
  },
  async deleteEmployee(id) {
    const response = await api.delete(`/employees/${id}`);
    return unwrap(response);
  },
  async tasks(id) {
    const response = await api.get(`/employees/${id}/tasks`);
    return unwrap(response);
  },
  async workload(id) {
    const response = await api.get(`/employees/${id}/workload`);
    return unwrap(response);
  },
  async timesheets(id, params = {}) {
    const response = await api.get(`/employees/${id}/timesheets`, { params });
    return unwrap(response);
  },
  async documents(id) {
    const response = await api.get(`/employees/${id}/documents`);
    return unwrap(response);
  },
};
