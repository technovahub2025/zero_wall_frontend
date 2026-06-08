import { api } from './api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const reportService = {
  async getOverview() {
    const response = await api.get('/reports');
    return unwrap(response);
  },
  async getProjectStatus() {
    const response = await api.get('/reports/project-status');
    return unwrap(response);
  },
  async getPriority() {
    const response = await api.get('/reports/priority');
    return unwrap(response);
  },
  async getTaskStatus() {
    const response = await api.get('/reports/task-status');
    return unwrap(response);
  },
  async getRevenueTrend() {
    const response = await api.get('/reports/revenue-trend');
    return unwrap(response);
  },
  async getStageCompletion() {
    const response = await api.get('/reports/stage-completion');
    return unwrap(response);
  },
  async getEngineerUtilization() {
    const response = await api.get('/reports/engineer-utilization');
    return unwrap(response);
  },
};
