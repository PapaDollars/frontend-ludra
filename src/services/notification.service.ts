import api from '@/lib/api';
import { toQuery, withMock } from '@/lib/mock';
import { mockMarkAllNotificationsRead, mockMarkNotificationRead, mockNotifications } from '@/mocks/notifications.mock';
import type { ApiResponse, NotificationPage } from '@/types';

/** Centre de notifications — auth. Remplace les notifications V1 (/notifications). */
export const notificationService = {
  /** GET /notifications?cursor=&limit= — plus récentes d'abord, avec le nombre de non lues. */
  list(cursor: string | null = null, limit = 20) {
    return withMock(
      () => mockNotifications(cursor, limit),
      async () => {
        const qs = toQuery({ cursor, limit });
        return (await api.get<ApiResponse<NotificationPage>>(`/notifications${qs ? `?${qs}` : ''}`)).data;
      },
    );
  },

  /** POST /notifications/:id/read */
  markRead(id: string) {
    return withMock(
      () => mockMarkNotificationRead(id),
      async () => { await api.post(`/notifications/${encodeURIComponent(id)}/read`); },
    );
  },

  /** POST /notifications/read-all */
  markAllRead() {
    return withMock(
      () => mockMarkAllNotificationsRead(),
      async () => { await api.post(`/notifications/read-all`); },
    );
  },
};
