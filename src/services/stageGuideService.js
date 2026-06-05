import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const stageGuideService = {
  async list() {
    const response = await api.get('/stage-guide');
    const payload = unwrap(response);
    return payload.data || payload || [];
  },

  async create(payload) {
    const response = await api.post('/stage-guide', payload);
    return unwrap(response);
  },

  async update(id, payload) {
    const response = await api.put(`/stage-guide/${id}`, payload);
    return unwrap(response);
  },

  async remove(id) {
    const response = await api.delete(`/stage-guide/${id}`);
    return unwrap(response);
  },
};
