import api from '@/lib/api';

export const contactService = {
  async send(propertyId: string, message: string) {
    const res = await api.post('/contacts', { propertyId, message });
    return res.data;
  },

  async getAll(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const res = await api.get(`/contacts${qs ? `?${qs}` : ''}`);
    return res;
  },

  async markAsRead(id: string) {
    return api.patch(`/contacts/${id}/read`);
  },
};
