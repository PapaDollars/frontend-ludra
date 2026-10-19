// types/account.ts — Module 15 : Compte / favoris / paiements
import type { Amount, ISODate } from './common';
import type { FeedItem } from './feed';
import type { KycStatus } from './kyc';
import type { Payment } from './payment';
import type { Subscription } from './subscription';

/** Tableau de bord « Mon compte ». */
export interface AccountOverview {
  user: {
    id: string;
    name: string;
    avatar?: string | null;
    city?: string;
    status: 'active' | 'restricted' | 'deletion_requested';
    memberSince: ISODate;
  };
  items: { total: number; active: number; archived: number; pending: number };
  favorites: number;
  messages: { total: number; unread: number };
  payments: { totalSpent: Amount; count: number };
  kycStatus: KycStatus;
  subscriptions: Subscription[];
  pendingReviews: number;
}

// ── Mes annonces / profils / services ──

export type MyItemStatus = 'active' | 'paused' | 'rented' | 'archived' | 'pending_review' | 'pending_kyc';

export interface MyItem {
  item: FeedItem;
  status: MyItemStatus;
  stats: { views: number; contacts: number; favorites: number };
  updatedAt: ISODate;
}

/** Statuts que l'utilisateur peut choisir lui-même. */
export type MyItemStatusChange = 'active' | 'paused' | 'rented' | 'archived';

// ── Favoris ──

export interface SavedCollection {
  id: string;
  name: string;
  count: number;
}

export interface SavedItem {
  item: FeedItem;
  savedAt: ISODate;
  collectionId: string | null;
}

// ── Paiements ──

/** Paiement de l'historique, avec libellé et reçu. */
export interface PaymentRecord extends Payment {
  label: string;
  /** Numéro de reçu (paiements "paid" uniquement). */
  receiptNumber?: string;
  listing?: { id: string; title: string };
  plan?: { code: string; name: string };
}

export interface ContactUnlock {
  listingId: string;
  title: string;
  publisherName: string;
  unlockedAt: ISODate;
}

// ── Paramètres ──

export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string | null;
  city?: string;
  avatar?: string | null;
  deletionRequestedAt?: ISODate | null;
}

export interface NotificationPreferences {
  newMessages: boolean;
  searchAlerts: boolean;
  reviews: boolean;
  payments: boolean;
  marketing: boolean;
  channels: { email: boolean; sms: boolean; push: boolean };
}
