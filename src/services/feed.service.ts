import api from '@/lib/api';
import { toQuery, withMock } from '@/lib/mock';
import { mockFeed, mockSuggestedAccounts } from '@/mocks/feed.mock';
import { applySaved } from '@/mocks/saved.mock';
import { isPubliclyVisible } from '@/mocks/account.mock';
import { isModerationVisible } from '@/mocks/admin.mock';
import type { ApiResponse, FeedPage, FeedQuery, Publisher, Universe } from '@/types';

export const feedService = {
  /** GET /feed?universe=&city=&cursor=&limit= — public (token optionnel pour isFavorite). */
  getFeed(query: FeedQuery = {}) {
    return withMock(
      () => { const page = mockFeed(query); return { ...page, items: page.items.filter(isPubliclyVisible).filter(isModerationVisible).map(applySaved) }; },
      async () => {
        const qs = toQuery(query);
        const res = await api.get<ApiResponse<FeedPage>>(`/feed${qs ? `?${qs}` : ''}`);
        return res.data;
      },
    );
  },

  /** GET /feed/suggested-accounts?universe= — comptes vérifiés du rail droit. */
  getSuggestedAccounts(universe?: Universe) {
    return withMock(
      () => mockSuggestedAccounts(),
      async () => {
        const qs = toQuery({ universe });
        const res = await api.get<ApiResponse<Publisher[]>>(
          `/feed/suggested-accounts${qs ? `?${qs}` : ''}`,
          { auth: false },
        );
        return res.data;
      },
    );
  },
};
