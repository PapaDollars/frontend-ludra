import api from '@/lib/api';

export const adminService = {
  async getGlobalStats() {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  async createUser(data: { name: string; email: string; phone: string; password: string; role: string; city?: string }) {
    const res = await api.post('/admin/users', data);
    return res.data;
  },

  // Users
  async getUsers(params: { role?: string; isActive?: boolean; search?: string; page?: number } = {}) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const res = await api.get(`/admin/users${qs ? `?${qs}` : ''}`);
    return res;
  },

  async toggleUserStatus(id: string, isActive: boolean, reason?: string) {
    return api.patch(`/admin/users/${id}/status`, { isActive, reason });
  },

  async deleteUser(id: string) {
    return api.delete(`/admin/users/${id}`);
  },

  // Properties
  async getAllProperties(params: { status?: string; isActive?: boolean; page?: number } = {}) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const res = await api.get(`/admin/properties${qs ? `?${qs}` : ''}`);
    return res;
  },

  async updatePropertyStatus(id: string, updates: { status?: string; isActive?: boolean; featured?: boolean }) {
    return api.patch(`/admin/properties/${id}/status`, updates);
  },

  async deleteProperty(id: string) {
    return api.delete(`/admin/properties/${id}`);
  },

  async getAdminLogs(params: { page?: number; limit?: number; action?: string } = {}) {
    const qs = Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${v}`).join('&');
    const res = await api.get(`/admin/logs${qs ? `?${qs}` : ''}`);
    return res;
  },

  // Filters
  async getFilters() {
    const res = await api.get('/admin/filters');
    return res.data;
  },

  async updateFilters(filters: { locations?: string[]; propertyTypes?: string[]; amenities?: string[] }) {
    return api.put('/admin/filters', filters);
  },
};
