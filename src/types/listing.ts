// types/listing.ts — Module 03 : Fiche détaillée du bien
import type { Amount } from './common';
import type { ListingFeedItem } from './feed';

/**
 * Accès au contact direct (M04).
 * `phone` / `whatsapp` ne sont présents QUE si `unlocked` est vrai
 * (paiement confirmé côté serveur) ou si le visiteur est le publieur.
 */
export interface ContactAccess {
  unlocked: boolean;
  /** Prix administrable du déblocage pour cette annonce (250–500 FCFA). */
  price: Amount;
  phone?: string;
  whatsapp?: string | null;
}

/** Statuts publics des contrôles internes — jamais les documents eux-mêmes (M03, M07). */
export interface ListingVerification {
  /** KYC du publieur validé. */
  identityVerified: boolean;
  /** Justificatif lié au bien contrôlé (titre, mandat…). */
  propertyDocumented: boolean;
}

export interface ListingDetail extends ListingFeedItem {
  description: string;
  verification: ListingVerification;
  contact: ContactAccess;
  /** Le visiteur connecté est le publieur de l'annonce. */
  viewerIsOwner: boolean;
}

export interface ContactDetails {
  phone: string;
  whatsapp: string | null;
}
