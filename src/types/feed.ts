// types/feed.ts — Module 01 : Accueil / Feed
import type { Amount, CursorPage, ISODate, Media, Publisher, Universe } from './common';

export type FeedFilter = 'tous' | Universe;

interface FeedItemBase {
  id: string;
  universe: Universe;
  publisher: Publisher;
  title: string;
  city: string;
  district?: string;
  media: Media[];
  createdAt: ISODate;
  /** Favori de l'utilisateur connecté (false si visiteur). */
  isFavorite: boolean;
  /** Mise en avant commerciale : doit être affichée "Sponsorisé" (§11). */
  sponsored: boolean;
}

export type TransactionType = 'location' | 'vente';
export type PropertyKind = 'appartement' | 'studio' | 'chambre' | 'maison' | 'villa' | 'terrain' | 'bureau' | 'commerce';
export type PriceUnit = 'mois' | 'nuit' | 'total';

export interface ListingFeedItem extends FeedItemBase {
  universe: 'immobilier';
  transaction: TransactionType;
  propertyKind: PropertyKind;
  price: Amount;
  priceUnit: PriceUnit;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  /** Libellés affichables, ex. ["parking", "meublé", "eau 24/7"]. */
  amenities: string[];
  /** Bien libre immédiatement (filtre "Disponible maintenant"). */
  availableNow: boolean;
}

export type CandidatePlan = 'gratuit' | 'standard' | 'premium';

export interface CandidateFeedItem extends FeedItemBase {
  universe: 'personnel';
  /** Métier affiché : "Chauffeure", "Ménagère"… */
  job: string;
  /** Code métier normalisé (SearchOptions.jobs) : chauffeur, menagere… */
  jobCode: string;
  experienceYears: number;
  availability: 'immediate' | 'sous_15_jours' | 'a_convenir';
  plan: CandidatePlan;
  /** Badge "Formé" — repose sur preuve (M10). */
  trained: boolean;
  /** Salaire visé (FCFA / mois) : critère de ciblage, jamais une garantie. */
  salaryMin?: Amount;
  salaryMax?: Amount;
}

export interface ServiceFeedItem extends FeedItemBase {
  universe: 'services';
  /** Slug catégorie : demenagement, plomberie, electricite… */
  category: string;
  categoryLabel: string;
  summary: string;
  priceFrom?: Amount;
  /** Professionnel réglementé (notaire, géomètre…) — M14. */
  regulated: boolean;
}

export type FeedItem = ListingFeedItem | CandidateFeedItem | ServiceFeedItem;

export interface FeedQuery {
  universe?: Universe;
  city?: string;
  cursor?: string | null;
  limit?: number;
}

export type FeedPage = CursorPage<FeedItem>;

/** Compteurs du header (messages / notifications non lus). */
export interface MeCounters {
  unreadMessages: number;
  unreadNotifications: number;
}
