import { api } from './api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

function getExport(response) {
  return {
    blob: response.data,
    fileName: response.headers?.['content-disposition'] || '',
  };
}

export const timesheetService = {
  async listMine(params = {}) {
    const response = await api.get('/timer/logs/mine', { params });
    return unwrap(response);
  },
  async listEmployee(employeeId, params = {}) {
    const response = await api.get(`/employees/${employeeId}/timesheets`, { params });
    return unwrap(response);
  },
  async exportMine(params = {}) {
    const response = await api.get('/timer/logs/export', { params, responseType: 'blob' });
    return getExport(response);
  },
  async exportEmployee(employeeId, params = {}) {
    const response = await api.get(`/employees/${employeeId}/timesheets/export`, { params, responseType: 'blob' });
    return getExport(response);
  },
  async bulkUpdateMine(payload) {
    const response = await api.post('/timer/logs/bulk-update', payload);
    return unwrap(response);
  },
  async bulkDeleteMine(payload) {
    const response = await api.post('/timer/logs/bulk-delete', payload);
    return unwrap(response);
  },
  async deleteMine(id) {
    const response = await api.delete(`/timer/${id}`);
    return unwrap(response);
  },
  async bulkUpdateEmployee(employeeId, payload) {
    const response = await api.post(`/employees/${employeeId}/timesheets/bulk-update`, payload);
    return unwrap(response);
  },
  async bulkDeleteEmployee(employeeId, payload) {
    const response = await api.post(`/employees/${employeeId}/timesheets/bulk-delete`, payload);
    return unwrap(response);
  },
  async listFilters(scope = 'mine') {
    const response = await api.get('/timesheet-filters', { params: { scope } });
    return unwrap(response);
  },
  async createFilter(payload) {
    const response = await api.post('/timesheet-filters', payload);
    return unwrap(response);
  },
  async updateFilter(id, payload) {
    const response = await api.put(`/timesheet-filters/${id}`, payload);
    return unwrap(response);
  },
  async deleteFilter(id) {
    const response = await api.delete(`/timesheet-filters/${id}`);
    return unwrap(response);
  },
};
