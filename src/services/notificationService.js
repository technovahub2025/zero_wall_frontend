import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const notificationService = {
  async list(params = {}) {
    const response = await api.get('/notifications', { params });
    return unwrap(response);
  },
  async unreadCount() {
    const response = await api.get('/notifications/unread-count');
    return unwrap(response);
  },
  async markRead(id) {
    const response = await api.put(`/notifications/${id}/read`);
    return unwrap(response);
  },
  async markAllRead() {
    const response = await api.put('/notifications/mark-all-read');
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/notifications/${id}`);
    return unwrap(response);
  },
};
