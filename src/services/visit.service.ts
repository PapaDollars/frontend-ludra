import api from '@/lib/api';

export const visitService = {
  async request(propertyId: string, preferredDate: string, message?: string) {
    const res = await api.post('/visits', { propertyId, preferredDate, message });
    return res.data;
  },

  async getAll(params: { status?: string; page?: number } = {}) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const res = await api.get(`/visits${qs ? `?${qs}` : ''}`);
    return res;
  },

  async respond(id: string, status: 'confirmed' | 'rejected', responseMessage?: string) {
    return api.patch(`/visits/${id}/respond`, { status, responseMessage });
  },

  async cancel(id: string) {
    return api.patch(`/visits/${id}/cancel`);
  },
};
