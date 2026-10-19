// mocks/listing.mock.ts — Fiche bien + paiement Mobile Money simulé (M03, M04)
// Paiement simulé : voir payment.mock.ts.
import { ApiError } from '@/lib/api';
import type {
  ContactDetails, ListingDetail, ListingFeedItem, Media, Payment, ReportInput, UnlockContactInput,
} from '@/types';
import { FEED_ITEMS, MOCK_ME } from './feed.mock';
import { mockCreatePayment } from './payment.mock';
import { persisted } from './storage';
import { settingsStore } from './settings.mock';
import { recordReport } from './reports.mock';

/** Prix administrable du déblocage (back-office). */
const unlockPrice = () => settingsStore.get().contactUnlock.price;

const img = (id: string): Media => ({ url: `https://images.unsplash.com/${id}?w=1200&h=750&fit=crop`, type: 'image' });

const EXTRA_MEDIA: Record<string, Media[]> = {
  'l-001': [img('photo-1560448204-e02f11c3d0e2'), img('photo-1484154218962-a197022b5858'), img('photo-1552321554-5fefe8c9ef14')],
  'l-002': [img('photo-1505691938895-1758d7feb511')],
  'l-004': [img('photo-1600585154340-be6161a56a0c'), img('photo-1600566753190-17f0baa2a6c3')],
};

/** Descriptions des annonces de démo (complétées par les publications via « + Publier »). */
export const DESCRIPTIONS: Record<string, string> = {
  'l-001': 'Appartement lumineux, accès facile, eau disponible, parking sécurisé. Visite sur rendez-vous.\n\nCuisine équipée, deux chambres avec placards, salon spacieux. Quartier calme à 5 minutes des commerces.',
  'l-003': 'Terrain plat de 500 m², accès route bitumée. Le vendeur annonce un titre foncier : faites-le vérifier par un notaire avant tout versement.',
};

// Coordonnées privées : jamais renvoyées avant paiement confirmé.
const PRIVATE_CONTACTS: Record<string, ContactDetails> = {};
const contactOf = (id: string): ContactDetails =>
  PRIVATE_CONTACTS[id] ?? { phone: '+237 6 77 12 34 56', whatsapp: '+237677123456' };


const unlockedStore = persisted<{ id: string; at: string }[]>('ludra.mock.unlocks', () => []);
const unlockedListings = {
  has: (id: string) => unlockedStore.get().some((u) => u.id === id),
  add: (id: string) => { if (!unlockedListings.has(id)) unlockedStore.set([{ id, at: new Date().toISOString() }, ...unlockedStore.get()]); },
};

/** Annonces dont le contact a été débloqué (interactions éligibles aux avis). */
export const mockUnlockedListingIds = () => unlockedStore.get().map((u) => u.id);

/** Déblocages contact de l'utilisateur (Mon compte › Paiements). */
export const mockUnlocks = () => unlockedStore.get().flatMap(({ id, at }) => {
  const item = FEED_ITEMS.find((i) => i.id === id);
  return item ? [{ listingId: id, title: item.title, publisherName: item.publisher.name, unlockedAt: at }] : [];
});

function findListing(id: string): ListingFeedItem {
  const item = FEED_ITEMS.find((i) => i.id === id);
  if (!item || item.universe !== 'immobilier') throw new ApiError('Annonce introuvable', 404, 'NOT_FOUND');
  return item;
}

export function mockListingDetail(id: string): ListingDetail {
  const item = findListing(id);
  const unlocked = unlockedListings.has(id);
  return {
    ...item,
    media: [...item.media, ...(EXTRA_MEDIA[id] ?? [])],
    description: DESCRIPTIONS[id] ?? 'Bien bien situé, visite sur rendez-vous via la messagerie LUDRA.',
    verification: {
      identityVerified: item.publisher.verified,
      propertyDocumented: item.publisher.verified && item.propertyKind !== 'terrain',
    },
    contact: unlocked
      ? { unlocked: true, price: unlockPrice(), ...contactOf(id) }
      : { unlocked: false, price: unlockPrice() },
    viewerIsOwner: item.publisher.id === MOCK_ME.id,
  };
}

export function mockListingContact(id: string): ContactDetails {
  findListing(id);
  if (!unlockedListings.has(id)) throw new ApiError('Paiement requis pour afficher le contact', 402, 'PAYMENT_REQUIRED');
  return contactOf(id);
}

export function mockCreateUnlock(input: UnlockContactInput): Payment {
  const listing = findListing(input.listingId);
  return mockCreatePayment({
    ...input,
    label: `Déblocage contact — ${listing.title}`,
    listing: { id: listing.id, title: listing.title },
    purpose: 'unlock_contact',
    amount: unlockPrice(),
    // Déjà débloqué : aucun nouveau débit.
    alreadyPaid: unlockedListings.has(input.listingId),
    onPaid: () => unlockedListings.add(input.listingId),
  });
}

export function mockReport(input: ReportInput) {
  recordReport(input);
  return { received: true };
}
