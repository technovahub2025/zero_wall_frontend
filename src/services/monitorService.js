import { api } from './api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const monitorService = {
  async overview(params = {}) {
    const response = await api.get('/monitor', { params });
    return unwrap(response);
  },
};
