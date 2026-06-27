import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export async function fetchDashboard() {
  const response = await api.get('/dashboard');
  return unwrap(response);
}

export async function fetchSuperadminDashboard() {
  const response = await api.get('/dashboard/superadmin');
  return unwrap(response);
}

export async function fetchEmployeeDashboard() {
  const response = await api.get('/dashboard/employee');
  return unwrap(response);
}

export async function fetchStages(params = {}) {
  const response = await api.get('/stages', { params });
  const payload = unwrap(response);
  return payload.data || payload || [];
}
