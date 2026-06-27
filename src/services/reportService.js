import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const reportService = {
  async getBundle(params = {}) {
    const response = await api.get('/reports/bundle', { params });
    return unwrap(response);
  },
  async getOverview(params = {}) {
    const response = await api.get('/reports', { params });
    return unwrap(response);
  },
  async getProjectStatus(params = {}) {
    const response = await api.get('/reports/project-status', { params });
    return unwrap(response);
  },
  async getPriority(params = {}) {
    const response = await api.get('/reports/priority', { params });
    return unwrap(response);
  },
  async getTaskStatus(params = {}) {
    const response = await api.get('/reports/task-status', { params });
    return unwrap(response);
  },
  async getTaskProgress(params = {}) {
    const response = await api.get('/reports/task-progress', { params });
    return unwrap(response);
  },
  async getRevenueTrend(params = {}) {
    const response = await api.get('/reports/revenue-trend', { params });
    return unwrap(response);
  },
  async getStageCompletion(params = {}) {
    const response = await api.get('/reports/stage-completion', { params });
    return unwrap(response);
  },
  async getEngineerUtilization(params = {}) {
    const response = await api.get('/reports/engineer-utilization', { params });
    return unwrap(response);
  },
  async getClientContribution(params = {}) {
    const response = await api.get('/reports/client-contribution', { params });
    return unwrap(response);
  },
  async getTimesheetAnalytics(params = {}) {
    const response = await api.get('/reports/timesheet-analytics', { params });
    return unwrap(response);
  },
};
