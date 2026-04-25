import api from '@/lib/api';

export interface Notification {
  id: string;
  type: 'property_approved' | 'property_rejected' | 'contact_request' | 'pending_property' | 'system';
  title: string;
  message: string;
  propertyId?: string;
  propertyTitle?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  async getNotifications(unreadOnly = false) {
    const res = await api.get(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
    return res.data as { notifications: Notification[]; unreadCount: number };
  },

  async markAsRead(id: string) {
    return api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead() {
    return api.patch('/notifications/read-all');
  },

  async deleteNotification(id: string) {
    return api.delete(`/notifications/${id}`);
  },
};
