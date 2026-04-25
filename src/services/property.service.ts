import api from '@/lib/api';

export interface PropertyFilters {
  search?: string;
  location?: string;
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: string;
  baths?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
}

const toQuery = (params: Record<string, any>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

export const propertyService = {
  async getProperties(filters: PropertyFilters = {}) {
    const qs = toQuery(filters as any);
    const res = await api.get(`/properties${qs ? `?${qs}` : ''}`, { auth: false });
    return res;
  },

  async getFeatured() {
    const res = await api.get('/properties/featured', { auth: false });
    return res.data as any[];
  },

  async getById(id: string) {
    const res = await api.get(`/properties/${id}`, { auth: false });
    return res.data;
  },

  async create(formData: FormData) {
    const res = await api.post('/properties', formData);
    return res.data;
  },

  async update(id: string, formData: FormData) {
    const res = await api.put(`/properties/${id}`, formData);
    return res.data;
  },

  async updateStatus(id: string, status: 'available' | 'occupied' | 'pending') {
    const res = await api.patch(`/properties/${id}/status`, { status });
    return res.data;
  },

  async delete(id: string) {
    return api.delete(`/properties/${id}`);
  },
};
