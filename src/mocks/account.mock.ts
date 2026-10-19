// mocks/account.mock.ts — Mon compte : vue d'ensemble, mes annonces, paiements, paramètres (démo)
import { ApiError } from '@/lib/api';
import type {
  AccountOverview, AccountProfile, FeedItem, MyItem, MyItemStatus, MyItemStatusChange, NotificationPreferences, PaymentRecord,
  PublishDraft,
} from '@/types';
import { FEED_ITEMS, MOCK_ME } from './feed.mock';
import { DESCRIPTIONS, mockUnlocks } from './listing.mock';
import { mockListConversations, mockUnreadTotal } from './messages.mock';
import { mockPaymentHistory } from './payment.mock';
import { mockCreateDraft } from './publish.mock';
import { mockEligibility } from './reviews.mock';
import { mockSavedCount } from './saved.mock';
import { SEARCH_OPTIONS } from './search.mock';
import { mockGetKyc } from './kyc.mock';
import { mockMySubscriptions } from './subscription.mock';
import { persisted } from './storage';

// ── Statuts de mes publications ──
const statuses = persisted<Record<string, MyItemStatus>>('ludra.mock.itemStatus', () => ({ 'l-me-2': 'archived' }));

const statusOf = (id: string): MyItemStatus => statuses.get()[id] ?? 'active';

/** Seules les publications actives apparaissent dans le feed et la recherche. */
export const isPubliclyVisible = (item: FeedItem) => item.publisher.id !== MOCK_ME.id || statusOf(item.id) === 'active';

const myItems = () => FEED_ITEMS.filter((i) => i.publisher.id === MOCK_ME.id);

/** Statistiques stables dérivées de l'id (démo). */
const statsOf = (id: string) => {
  const h = [...id].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 997, 7);
  return { views: 40 + (h % 300), contacts: h % 12, favorites: h % 9 };
};

export function mockMyItems(status?: MyItemStatus | 'all'): MyItem[] {
  return myItems()
    .map((item) => ({ item, status: statusOf(item.id), stats: statsOf(item.id), updatedAt: item.createdAt }))
    .filter((m) => !status || status === 'all' || m.status === status);
}

const ALLOWED: Record<MyItemStatusChange, MyItemStatus[]> = {
  active: ['paused', 'rented', 'archived'],
  paused: ['active'],
  rented: ['active'],
  archived: ['active', 'paused', 'rented'],
};

export function mockSetItemStatus(id: string, next: MyItemStatusChange): MyItem {
  const item = myItems().find((i) => i.id === id);
  if (!item) throw new ApiError('Publication introuvable', 404, 'NOT_FOUND');
  if (!ALLOWED[next].includes(statusOf(id))) throw new ApiError('Changement de statut impossible.', 409, 'INVALID_TRANSITION');
  if (next === 'rented' && item.universe !== 'immobilier') throw new ApiError('Statut réservé aux biens immobiliers.', 422, 'VALIDATION_ERROR');
  statuses.set({ ...statuses.get(), [id]: next });
  return mockMyItems().find((m) => m.item.id === id)!;
}

const codeOf = (list: { value: string; label: string }[], label: string) =>
  list.find((o) => o.label.toLowerCase() === label.toLowerCase())?.value ?? label;

/** Brouillon pré-rempli pour modifier une publication (republication = mise à jour). */
export function mockEditDraft(id: string): PublishDraft {
  const item = myItems().find((i) => i.id === id);
  if (!item) throw new ApiError('Publication introuvable', 404, 'NOT_FOUND');
  const media = item.media.map((m, i) => ({ id: `up-src-${id}-${i}`, url: m.url, type: 'image' as const }));
  const base = { type: item.universe, step: 2, media, sourceItemId: id };
  if (item.universe === 'immobilier') {
    return mockCreateDraft({
      ...base,
      listing: {
        publisherRole: 'owner', transaction: item.transaction, propertyKind: item.propertyKind, title: item.title,
        description: DESCRIPTIONS[id] ?? `${item.title}. Visite sur rendez-vous via la messagerie LUDRA.`,
        city: item.city, district: item.district, price: item.price, priceUnit: item.priceUnit,
        bedrooms: item.bedrooms, bathrooms: item.bathrooms, surface: item.surface,
        amenities: item.amenities.map((a) => codeOf(SEARCH_OPTIONS.amenities, a)), availableNow: item.availableNow,
      },
    });
  }
  if (item.universe === 'personnel') {
    return mockCreateDraft({
      ...base,
      candidate: {
        job: item.jobCode, title: item.title, summary: item.title, city: item.city, district: item.district,
        experienceYears: item.experienceYears, availability: item.availability, salaryMin: item.salaryMin, salaryMax: item.salaryMax,
      },
    });
  }
  return mockCreateDraft({
    ...base,
    service: { category: item.category, structure: 'independant', title: item.title, description: item.summary, city: item.city, priceFrom: item.priceFrom },
  });
}

// ── Paiements ──
export const mockPayments = (): PaymentRecord[] => mockPaymentHistory();

export function mockPayment(id: string): PaymentRecord {
  const p = mockPaymentHistory().find((r) => r.id === id);
  if (!p) throw new ApiError('Paiement introuvable', 404, 'NOT_FOUND');
  return p;
}

export const mockContactUnlocks = () => mockUnlocks();

// ── Profil, préférences, sécurité ──
const profile = persisted<AccountProfile | null>('ludra.mock.profile', () => null);
const prefs = persisted<NotificationPreferences>('ludra.mock.prefs', () => ({
  newMessages: true, searchAlerts: true, reviews: true, payments: true, marketing: false,
  channels: { email: true, sms: false, push: true },
}));

export function mockProfile(fallback: Partial<AccountProfile>): AccountProfile {
  return profile.get() ?? { id: MOCK_ME.id, name: fallback.name || 'Vous', email: fallback.email || 'vous@exemple.cm', phone: fallback.phone, city: fallback.city || 'Yaoundé', avatar: null, whatsapp: null, deletionRequestedAt: null };
}

export function mockUpdateProfile(fallback: Partial<AccountProfile>, patch: Partial<AccountProfile>): AccountProfile {
  const next = { ...mockProfile(fallback), ...patch };
  profile.set(next);
  return next;
}

export const mockPreferences = () => prefs.get();
export const mockSetPreferences = (p: NotificationPreferences) => { prefs.set(p); return p; };

export function mockChangePassword(current: string, next: string) {
  if (current === next) throw new ApiError('Le nouveau mot de passe doit être différent.', 422, 'VALIDATION_ERROR');
  if (current === 'mauvais') throw new ApiError('Mot de passe actuel incorrect.', 403, 'WRONG_PASSWORD');
  return { changed: true };
}

// ── Vue d'ensemble ──
export function mockOverview(fallback: Partial<AccountProfile>): AccountOverview {
  const p = mockProfile(fallback);
  const items = mockMyItems();
  const payments = mockPaymentHistory().filter((r) => r.status === 'paid');
  const conversations = mockListConversations().items;
  return {
    user: { id: p.id, name: p.name, avatar: p.avatar, city: p.city, status: p.deletionRequestedAt ? 'deletion_requested' : 'active', memberSince: new Date(Date.now() - 200 * 86_400_000).toISOString() },
    items: {
      total: items.length,
      active: items.filter((i) => i.status === 'active').length,
      archived: items.filter((i) => i.status === 'archived').length,
      pending: items.filter((i) => i.status.startsWith('pending')).length,
    },
    favorites: mockSavedCount(),
    messages: { total: conversations.length, unread: mockUnreadTotal() },
    payments: { totalSpent: payments.reduce((n, r) => n + r.amount, 0), count: payments.length },
    kycStatus: mockGetKyc().status,
    subscriptions: mockMySubscriptions(),
    pendingReviews: mockEligibility().filter((i) => !i.reviewId).length,
  };
}
