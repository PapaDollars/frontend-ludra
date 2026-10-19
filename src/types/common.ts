// types/common.ts — Types partagés LUDRA HOME V2.1
// Ces types sont la référence du contrat API (docs/API_CONTRACT_V2.1.md).

/** Enveloppe standard renvoyée par le backend. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Pagination par curseur (feed, listes infinies). */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

/** Les trois univers métier de LUDRA. */
export type Universe = 'immobilier' | 'personnel' | 'services';

/** ISO 8601, ex. "2026-10-15T09:30:00.000Z". */
export type ISODate = string;

/** Montants toujours en FCFA (XAF), entiers. */
export type Amount = number;

export type PublisherKind =
  | 'owner'      // Propriétaire / bailleur
  | 'agent'      // Agent immobilier
  | 'candidate'  // Candidat personnel
  | 'recruiter'  // Recruteur / chef d'entreprise
  | 'provider'   // Prestataire de service
  | 'user';      // Client simple

/** Auteur public d'une publication. Ne contient JAMAIS de téléphone ni de document KYC. */
export interface Publisher {
  id: string;
  name: string;
  avatar?: string | null;
  kind: PublisherKind;
  /** Badge public "Identité vérifiée" (KYC validé). */
  verified: boolean;
  rating?: number;
  reviewsCount?: number;
  city?: string;
}

export interface Media {
  url: string;
  type: 'image' | 'video';
  alt?: string;
}
