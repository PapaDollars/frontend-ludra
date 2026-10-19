// types/search.ts — Module 02 : Recherche & filtres
import type { ISODate, Universe } from './common';
import type { CandidateFeedItem, PropertyKind, TransactionType } from './feed';

/**
 * `pertinence` : pertinence + bonus de visibilité borné (plans) ;
 * `pertinence_pure` : pertinence seule, sans effet des plans (recruteurs, M13).
 */
export type SearchSort = 'pertinence' | 'pertinence_pure' | 'recent' | 'prix_asc' | 'prix_desc';

/**
 * Filtres de recherche. Sérialisés tels quels en query string
 * (tableaux joints par des virgules, booléens "true").
 */
export interface SearchFilters {
  universe: Universe;
  /** Texte libre : titre, quartier, métier, service, publieur. */
  q?: string;
  city?: string;
  district?: string;
  verifiedOnly?: boolean;
  sort?: SearchSort;

  // ── Immobilier ──
  transaction?: TransactionType;
  propertyKind?: PropertyKind;
  budgetMin?: number;
  budgetMax?: number;
  bedroomsMin?: number;
  surfaceMin?: number;
  /** Codes d'équipement : meuble, parking, eau_24_7… (voir SearchOptions.amenities). */
  amenities?: string[];
  availableNow?: boolean;

  // ── Personnel ──
  /** Code métier : chauffeur, menagere… (voir SearchOptions.jobs). */
  job?: string;
  experienceMin?: number;
  availability?: CandidateFeedItem['availability'];
  trainedOnly?: boolean;
  /** Budget recruteur : profils dont le salaire visé minimum est ≤ à ce montant. */
  salaryMax?: number;

  // ── Services ──
  /** Code catégorie : demenagement, plomberie… (voir SearchOptions.serviceCategories). */
  category?: string;
}

export interface Option<V extends string = string> {
  value: V;
  label: string;
}

export interface CityOption {
  name: string;
  districts: string[];
}

/** Référentiels administrables (villes, types, équipements, métiers, catégories). */
export interface SearchOptions {
  cities: CityOption[];
  propertyKinds: Option<PropertyKind>[];
  amenities: Option[];
  jobs: Option[];
  serviceCategories: Option[];
}

export type SuggestionKind = 'city' | 'district' | 'job' | 'category';

/** Suggestion d'autocomplétion : appliquer `filters` sur la recherche courante. */
export interface SearchSuggestion {
  kind: SuggestionKind;
  label: string;
  /** Contexte affiché en gris, ex. "Quartier · Yaoundé". */
  hint?: string;
  filters: Partial<SearchFilters>;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  alertEnabled: boolean;
  /** Nouvelles offres depuis la dernière consultation. */
  newResults: number;
  createdAt: ISODate;
}

export interface SavedSearchInput {
  name: string;
  filters: SearchFilters;
  alertEnabled: boolean;
}
