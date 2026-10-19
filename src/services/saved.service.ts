import api from '@/lib/api';
import { toQuery, withMock } from '@/lib/mock';
import {
  mockCollections, mockCreateCollection, mockDeleteCollection, mockMoveSaved, mockRenameCollection, mockSavedList, mockToggleSaved,
} from '@/mocks/saved.mock';
import type { ApiResponse, CursorPage, SavedCollection, SavedItem, Universe } from '@/types';

export interface SavedToggleResult {
  itemId: string;
  isFavorite: boolean;
}

const enc = encodeURIComponent;

/** Favoris (M15) — toutes les routes sont auth. */
export const savedService = {
  /** POST /saved/toggle { itemId, universe } — enregistrer / retirer. */
  toggle(itemId: string, universe: Universe, _current: boolean) {
    return withMock<SavedToggleResult>(
      () => mockToggleSaved(itemId),
      async () =>
        (await api.post<ApiResponse<SavedToggleResult>>(`/saved/toggle`, { itemId, universe })).data,
    );
  },

  /** GET /saved?universe=&collectionId=&cursor=&limit= — `collectionId=none` : sans collection. */
  list(opts: { universe?: Universe; collectionId?: string | null; cursor?: string | null; limit?: number } = {}) {
    return withMock(
      () => mockSavedList(opts),
      async () => {
        const qs = toQuery({ ...opts, collectionId: opts.collectionId === null ? 'none' : opts.collectionId });
        return (await api.get<ApiResponse<CursorPage<SavedItem>>>(`/saved${qs ? `?${qs}` : ''}`)).data;
      },
    );
  },

  /** GET /saved/collections */
  collections() {
    return withMock(
      () => mockCollections(),
      async () => (await api.get<ApiResponse<SavedCollection[]>>(`/saved/collections`)).data,
    );
  },

  /** POST /saved/collections { name } — 409 si nom déjà utilisé. */
  createCollection(name: string) {
    return withMock(
      () => mockCreateCollection(name),
      async () => (await api.post<ApiResponse<SavedCollection>>(`/saved/collections`, { name })).data,
    );
  },

  /** PATCH /saved/collections/:id { name } */
  renameCollection(id: string, name: string) {
    return withMock(
      () => mockRenameCollection(id, name),
      async () => (await api.patch<ApiResponse<SavedCollection>>(`/saved/collections/${enc(id)}`, { name })).data,
    );
  },

  /** DELETE /saved/collections/:id — les favoris repassent « sans collection ». */
  deleteCollection(id: string) {
    return withMock(
      () => mockDeleteCollection(id),
      async () => { await api.delete(`/saved/collections/${enc(id)}`); },
    );
  },

  /** PATCH /saved/:itemId { collectionId | null } — ranger un favori. */
  move(itemId: string, collectionId: string | null) {
    return withMock(
      () => mockMoveSaved(itemId, collectionId),
      async () => { await api.patch(`/saved/${enc(itemId)}`, { collectionId }); },
    );
  },
};
