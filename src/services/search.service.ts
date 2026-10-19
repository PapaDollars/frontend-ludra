import api from '@/lib/api';
import { toQuery, withMock } from '@/lib/mock';
import { filtersToQuery } from '@/lib/searchFilters';
import {
  SEARCH_OPTIONS, mockCreateSaved, mockDeleteSaved, mockListSaved, mockSearch, mockSearchCount, mockSuggestions, mockUpdateSaved,
} from '@/mocks/search.mock';
import { applySaved } from '@/mocks/saved.mock';
import { isPubliclyVisible } from '@/mocks/account.mock';
import { isModerationVisible } from '@/mocks/admin.mock';
import type {
  ApiResponse, CursorPage, FeedItem, SavedSearch, SavedSearchInput, SearchFilters, SearchOptions, SearchSuggestion,
} from '@/types';

const withCursor = (filters: SearchFilters, cursor: string | null, limit: number) => {
  const qs = filtersToQuery(filters);
  const extra = toQuery({ cursor, limit });
  return [qs, extra].filter(Boolean).join('&');
};

export const searchService = {
  /** GET /search/options — référentiels des filtres (public, administrable). */
  getOptions() {
    return withMock(
      () => SEARCH_OPTIONS,
      async () => (await api.get<ApiResponse<SearchOptions>>(`/search/options`, { auth: false })).data,
    );
  },

  /** GET /search?<filtres>&cursor=&limit= — résultats paginés (public). */
  search(filters: SearchFilters, cursor: string | null = null, limit = 10) {
    return withMock(
      () => { const page = mockSearch(filters, cursor, limit); return { ...page, items: page.items.filter(isPubliclyVisible).filter(isModerationVisible).map(applySaved) }; },
      async () => (await api.get<ApiResponse<CursorPage<FeedItem>>>(`/search?${withCursor(filters, cursor, limit)}`)).data,
    );
  },

  /** GET /search/count?<filtres> — compteur live du bouton "Afficher N offres" (public). */
  count(filters: SearchFilters) {
    return withMock(
      () => mockSearchCount(filters),
      async () => (await api.get<ApiResponse<{ total: number }>>(`/search/count?${filtersToQuery(filters)}`, { auth: false })).data,
    );
  },

  /** GET /search/suggestions?q= — villes, quartiers, métiers, services (public). */
  suggestions(q: string) {
    return withMock(
      () => mockSuggestions(q),
      async () => (await api.get<ApiResponse<SearchSuggestion[]>>(`/search/suggestions?${toQuery({ q })}`, { auth: false })).data,
    );
  },

  // ── Recherches sauvegardées + alertes (auth) ──

  /** GET /saved-searches */
  listSaved() {
    return withMock(
      () => mockListSaved(),
      async () => (await api.get<ApiResponse<SavedSearch[]>>(`/saved-searches`)).data,
    );
  },

  /** POST /saved-searches { name, filters, alertEnabled } */
  createSaved(input: SavedSearchInput) {
    return withMock(
      () => mockCreateSaved(input),
      async () => (await api.post<ApiResponse<SavedSearch>>(`/saved-searches`, input)).data,
    );
  },

  /** PATCH /saved-searches/:id { name?, alertEnabled? } */
  updateSaved(id: string, patch: Partial<Pick<SavedSearchInput, 'name' | 'alertEnabled'>>) {
    return withMock(
      () => mockUpdateSaved(id, patch),
      async () => (await api.patch<ApiResponse<SavedSearch>>(`/saved-searches/${id}`, patch)).data,
    );
  },

  /** DELETE /saved-searches/:id */
  deleteSaved(id: string) {
    return withMock(
      () => mockDeleteSaved(id),
      async () => { await api.delete(`/saved-searches/${id}`); },
    );
  },
};
