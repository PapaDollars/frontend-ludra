import api from '@/lib/api';

export const landlordService = {
  async getStats() {
    const res = await api.get('/landlord/stats');
    return res.data;
  },

  async getMyProperties(params: { status?: string; page?: number; limit?: number } = {}) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const res = await api.get(`/landlord/properties${qs ? `?${qs}` : ''}`);
    return res;
  },

  async getMyContacts(unreadOnly = false) {
    const res = await api.get(`/landlord/contacts${unreadOnly ? '?unreadOnly=true' : ''}`);
    return res;
  },

  async getMyVisits(status?: string) {
    const res = await api.get(`/landlord/visits${status ? `?status=${status}` : ''}`);
    return res;
  },

  async updateMyPropertyStatus(id: string, status: 'available' | 'occupied') {
    const res = await api.patch(`/landlord/properties/${id}/status`, { status });
    return res;
  },
};
