import { api } from '../lib/api';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const teamService = {
  async getMembers() {
    const response = await api.get('/team/members');
    return unwrap(response);
  },
  async getInvites() {
    const response = await api.get('/team/invites');
    return unwrap(response);
  },
  async invite(payload) {
    const response = await api.post('/team/invite', payload);
    return unwrap(response);
  },
  async resend(id) {
    const response = await api.post(`/team/${id}/resend`);
    return unwrap(response);
  },
  async revokeInvite(id) {
    const response = await api.delete(`/team/${id}/invite`);
    return unwrap(response);
  },
  async changeRole(id, payload) {
    const response = await api.put(`/team/${id}/role`, payload);
    return unwrap(response);
  },
  async removeMember(id) {
    const response = await api.delete(`/team/${id}`);
    return unwrap(response);
  },
};
