import api from '@/lib/api';
import { API_MODE, withMock } from '@/lib/mock';
import { notificationService } from './notification.service';
import { messagingService } from './messaging.service';
import { mockCounters } from '@/mocks/feed.mock';
import { mockUnreadTotal } from '@/mocks/messages.mock';
import { mockUnreadNotifications } from '@/mocks/notifications.mock';
import type { ApiResponse, MeCounters } from '@/types';

export const meService = {
  /** GET /me/counters — badges messages / notifications du header (auth). */
  getCounters() {
    // Mode mixte, tant que GET /me/counters n'existe pas : compteurs reconstitués depuis les routes réelles
    // (non lues de la 1re page de conversations + compteur de notifications). Plus coûteux : à retirer dès /me/counters.
    if (API_MODE === 'mixed') {
      return Promise.all([notificationService.list(null, 1), messagingService.list()])
        .then(([notifs, convs]) => ({
          unreadNotifications: notifs.unread,
          unreadMessages: convs.items.reduce((n, c) => n + (c.unreadCount || 0), 0),
        }));
    }
    return withMock(
      () => ({ ...mockCounters(), unreadMessages: mockUnreadTotal(), unreadNotifications: mockUnreadNotifications() }),
      async () => (await api.get<ApiResponse<MeCounters>>(`/me/counters`)).data,
    );
  },
};
