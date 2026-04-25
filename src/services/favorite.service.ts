import api from '@/lib/api';

export const favoriteService = {
  async getFavorites() {
    const res = await api.get('/favorites');
    return res.data as any[];
  },

  async toggle(propertyId: string) {
    const res = await api.post(`/favorites/${propertyId}/toggle`);
    return res.data as { propertyId: string; isFavorite: boolean };
  },

  async add(propertyId: string) {
    const res = await api.post(`/favorites/${propertyId}`);
    return res.data;
  },

  async remove(propertyId: string) {
    return api.delete(`/favorites/${propertyId}`);
  },
};
