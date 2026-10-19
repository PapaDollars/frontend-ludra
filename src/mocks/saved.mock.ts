// mocks/saved.mock.ts — Favoris + collections (démo, persistés)
import { ApiError } from '@/lib/api';
import type { CursorPage, SavedCollection, SavedItem, Universe } from '@/types';
import { FEED_ITEMS } from './feed.mock';
import { persisted } from './storage';

interface Stored {
  items: Record<string, { savedAt: string; collectionId: string | null }>;
  collections: { id: string; name: string }[];
}

const store = persisted<Stored>('ludra.mock.saved', () => ({
  items: { 'l-002': { savedAt: new Date(Date.now() - 86_400_000).toISOString(), collectionId: null } },
  collections: [],
}));

/** Reflète l'état "enregistré" dans les items renvoyés par les autres mocks (feed, recherche, fiche). */
export function applySaved<T extends { id: string; isFavorite: boolean }>(item: T): T {
  return { ...item, isFavorite: !!store.get().items[item.id] };
}

export function mockToggleSaved(itemId: string) {
  const s = store.get();
  const items = { ...s.items };
  if (items[itemId]) delete items[itemId];
  else items[itemId] = { savedAt: new Date().toISOString(), collectionId: null };
  store.set({ ...s, items });
  return { itemId, isFavorite: !!items[itemId] };
}

export function mockSavedList(opts: { universe?: Universe; collectionId?: string | null; cursor?: string | null; limit?: number }): CursorPage<SavedItem> {
  const { items } = store.get();
  const all: SavedItem[] = Object.entries(items)
    .flatMap(([id, meta]) => {
      const item = FEED_ITEMS.find((i) => i.id === id);
      return item ? [{ item: { ...item, isFavorite: true }, ...meta }] : [];
    })
    .filter((s) => !opts.universe || s.item.universe === opts.universe)
    .filter((s) => opts.collectionId === undefined || s.collectionId === opts.collectionId)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const start = opts.cursor ? Number(opts.cursor) : 0;
  const next = start + (opts.limit ?? 20);
  return { items: all.slice(start, next), nextCursor: next < all.length ? String(next) : null, total: all.length };
}

export const mockSavedCount = () => Object.keys(store.get().items).length;

export function mockCollections(): SavedCollection[] {
  const { items, collections } = store.get();
  return collections.map((c) => ({ ...c, count: Object.values(items).filter((i) => i.collectionId === c.id).length }));
}

export function mockCreateCollection(name: string): SavedCollection {
  const s = store.get();
  if (s.collections.some((c) => c.name.toLowerCase() === name.toLowerCase())) throw new ApiError('Une collection porte déjà ce nom.', 409, 'DUPLICATE');
  const c = { id: `col-${Date.now()}`, name };
  store.set({ ...s, collections: [...s.collections, c] });
  return { ...c, count: 0 };
}

export function mockRenameCollection(id: string, name: string): SavedCollection {
  const s = store.get();
  store.set({ ...s, collections: s.collections.map((c) => (c.id === id ? { ...c, name } : c)) });
  return mockCollections().find((c) => c.id === id)!;
}

export function mockDeleteCollection(id: string) {
  const s = store.get();
  const items = Object.fromEntries(Object.entries(s.items).map(([k, v]) => [k, v.collectionId === id ? { ...v, collectionId: null } : v]));
  store.set({ items, collections: s.collections.filter((c) => c.id !== id) });
}

export function mockMoveSaved(itemId: string, collectionId: string | null) {
  const s = store.get();
  if (!s.items[itemId]) throw new ApiError('Élément non enregistré', 404, 'NOT_FOUND');
  store.set({ ...s, items: { ...s.items, [itemId]: { ...s.items[itemId], collectionId } } });
}
