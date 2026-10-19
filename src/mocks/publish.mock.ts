// mocks/publish.mock.ts — Brouillons, uploads et publication (démo)
//
// Simulation : la publication en tant qu'agent renvoie "pending_kyc" (KYC renforcé, M07) ;
// propriétaire, candidat et prestataire sont publiés directement et ajoutés au feed de démo.
import { ApiError } from '@/lib/api';
import { maskContactInfo } from '@/lib/messageSafety';
import type {
  FeedItem, FieldError, PublishDraft, PublishDraftPatch, PublishResult, UploadedMedia,
} from '@/types';
import { FEED_ITEMS, MOCK_ME, addFeedItem } from './feed.mock';
import { SEARCH_OPTIONS } from './search.mock';
import { DESCRIPTIONS } from './listing.mock';

// Persistance locale (démo uniquement) pour tester la reprise de brouillon après rechargement.
// Les photos (URL blob) ne survivent pas au rechargement.
const STORAGE_KEY = 'ludra.mock.drafts';
const drafts = new Map<string, PublishDraft>(load());
let seq = 0;

function load(): [string, PublishDraft][] {
  try {
    if (typeof window === 'undefined') return [];
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

function persist() {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...drafts.entries()])); } catch { /* quota / navigation privée */ }
}

const emptyDraft = (id: string): PublishDraft => ({
  id, type: null, step: 0, listing: {}, candidate: {}, service: {}, media: [], updatedAt: new Date().toISOString(),
});

function get(id: string) {
  const d = drafts.get(id);
  if (!d) throw new ApiError('Brouillon introuvable', 404, 'NOT_FOUND');
  return d;
}

export const mockListDrafts = () =>
  [...drafts.values()].filter((d) => d.type).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export function mockCreateDraft(patch: PublishDraftPatch): PublishDraft {
  const d = { ...emptyDraft(`dr-${Date.now()}-${++seq}`), ...patch, updatedAt: new Date().toISOString() };
  drafts.set(d.id, d);
  persist();
  return { ...d };
}

export const mockGetDraft = (id: string): PublishDraft => ({ ...get(id) });

export function mockUpdateDraft(id: string, patch: PublishDraftPatch): PublishDraft {
  const d = { ...get(id), ...patch, updatedAt: new Date().toISOString() };
  drafts.set(id, d);
  persist();
  return { ...d };
}

export const mockDeleteDraft = (id: string) => { drafts.delete(id); persist(); };

export function mockUpload(file: File): UploadedMedia {
  return { id: `up-${Date.now()}-${++seq}`, url: globalThis.URL.createObjectURL(file), type: 'image' };
}

const label = (list: { value: string; label: string }[], v?: string) => list.find((o) => o.value === v)?.label ?? v ?? '';

export function mockPublish(id: string): PublishResult {
  const d = get(id);
  const errors: FieldError[] = [];
  const now = new Date().toISOString();
  const base = { publisher: { ...MOCK_ME }, media: d.media.map(({ url, type }) => ({ url, type })), createdAt: now, isFavorite: false, sponsored: false };
  let item: FeedItem;

  switch (d.type) {
    case 'immobilier': {
      const l = d.listing;
      if (!d.media.length) errors.push({ field: 'media', message: 'Ajoutez au moins une photo.' });
      if (errors.length) break;
      item = {
        ...base, id: `l-${Date.now()}`, universe: 'immobilier', title: l.title!, city: l.city!, district: l.district,
        publisher: { ...MOCK_ME, kind: l.publisherRole === 'agent' ? 'agent' : 'owner' },
        transaction: l.transaction!, propertyKind: l.propertyKind!, price: l.price!, priceUnit: l.priceUnit!,
        bedrooms: l.bedrooms, bathrooms: l.bathrooms, surface: l.surface,
        amenities: (l.amenities ?? []).map((a) => label(SEARCH_OPTIONS.amenities, a).toLowerCase()),
        availableNow: !!l.availableNow,
      };
      break;
    }
    case 'personnel': {
      const c = d.candidate;
      item = {
        ...base, id: `c-${Date.now()}`, universe: 'personnel', title: c.title!, city: c.city!, district: c.district,
        publisher: { ...MOCK_ME, kind: 'candidate' },
        job: label(SEARCH_OPTIONS.jobs, c.job), jobCode: c.job!, experienceYears: c.experienceYears ?? 0,
        availability: c.availability ?? 'a_convenir', plan: 'gratuit', trained: false,
      };
      break;
    }
    case 'services': {
      const s = d.service;
      item = {
        ...base, id: `s-${Date.now()}`, universe: 'services', title: s.title!, city: s.city!,
        publisher: { ...MOCK_ME, kind: 'provider', name: s.businessName || MOCK_ME.name },
        category: s.category!, categoryLabel: label(SEARCH_OPTIONS.serviceCategories, s.category),
        summary: s.description!.slice(0, 140), priceFrom: s.priceFrom, regulated: s.category === 'professionnels_habilites',
      };
      break;
    }
    default:
      errors.push({ field: 'type', message: 'Choisissez un type de publication.' });
  }

  if (errors.length) throw new ApiError('Certains champs sont à corriger.', 422, 'VALIDATION_ERROR', errors);

  if (d.onBehalfOf) item!.publisher = { ...item!.publisher, id: d.onBehalfOf.userId, name: d.onBehalfOf.name, verified: false };
  // Le serveur masque les coordonnées dans les textes publiés (comme dans la messagerie).
  item!.title = maskContactInfo(item!.title).text;
  if (d.sourceItemId) {
    const idx = FEED_ITEMS.findIndex((i) => i.id === d.sourceItemId);
    if (idx >= 0) {
      item!.id = d.sourceItemId;
      item!.createdAt = FEED_ITEMS[idx].createdAt;
      item!.publisher = FEED_ITEMS[idx].publisher;
    }
  }
  addFeedItem(item!);
  if (d.type === 'immobilier' && d.listing.description) DESCRIPTIONS[item!.id] = maskContactInfo(d.listing.description).text;
  drafts.delete(id);
  persist();
  const status = d.type === 'immobilier' && d.listing.publisherRole === 'agent' ? 'pending_kyc' : 'published';
  return { status, universe: d.type!, itemId: item!.id };
}
