import api from '@/lib/api';
import { withMock } from '@/lib/mock';
import { mockCounters } from '@/mocks/feed.mock';
import { mockUnreadTotal } from '@/mocks/messages.mock';
import { mockUnreadNotifications } from '@/mocks/notifications.mock';
import type { ApiResponse, MeCounters } from '@/types';

export const meService = {
  /** GET /me/counters — badges messages / notifications du header (auth). */
  getCounters() {
    return withMock(
      () => ({ ...mockCounters(), unreadMessages: mockUnreadTotal(), unreadNotifications: mockUnreadNotifications() }),
      async () => (await api.get<ApiResponse<MeCounters>>(`/me/counters`)).data,
    );
  },
};
