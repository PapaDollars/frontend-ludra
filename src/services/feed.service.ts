import api from '@/lib/api';
import { API_MODE, toQuery, withMock } from '@/lib/mock';
import { searchService } from './search.service';
import { mockFeed, mockSuggestedAccounts } from '@/mocks/feed.mock';
import { applySaved } from '@/mocks/saved.mock';
import { isPubliclyVisible } from '@/mocks/account.mock';
import { isModerationVisible } from '@/mocks/admin.mock';
import type { ApiResponse, FeedPage, FeedQuery, Publisher, Universe } from '@/types';

export const feedService = {
  /** GET /feed?universe=&city=&cursor=&limit= — public (token optionnel pour isFavorite). */
  getFeed(query: FeedQuery = {}) {
    // Mode mixte, tant que GET /feed n'existe pas : les profils candidats viennent du backend (recherche personnel),
    // les autres univers restent en démo — un candidat de démo ne renverrait vers aucun profil réel.
    if (API_MODE === 'mixed' && query.universe === 'personnel') {
      return searchService.search({ universe: 'personnel', ...(query.city && { city: query.city }), sort: 'recent' }, query.cursor ?? null, query.limit);
    }
    const mixedWithoutPersonnel = API_MODE === 'mixed' && !query.universe;
    return withMock(
      () => {
        const page = mockFeed(query);
        const items = page.items.filter(isPubliclyVisible).filter(isModerationVisible).filter((i) => !mixedWithoutPersonnel || i.universe !== 'personnel');
        return { ...page, items: items.map(applySaved) };
      },
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
