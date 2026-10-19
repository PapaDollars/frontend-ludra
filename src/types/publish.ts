// types/publish.ts — Module 06 : Publication + Publier (wizard avec brouillon)
import type { Amount, ISODate, Universe } from './common';
import type { CandidateFeedItem, PriceUnit, PropertyKind, TransactionType } from './feed';

/** Rôle demandé uniquement pour un bien immobilier (dossier §3.1). */
export type PublisherRole = 'owner' | 'agent';

export interface ListingDraftData {
  publisherRole?: PublisherRole;
  /** Agent uniquement. */
  agencyName?: string;
  transaction?: TransactionType;
  propertyKind?: PropertyKind;
  title?: string;
  description?: string;
  city?: string;
  district?: string;
  price?: Amount;
  priceUnit?: PriceUnit;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  /** Codes de SearchOptions.amenities. */
  amenities?: string[];
  availableNow?: boolean;
}

export interface CandidateDraftData {
  /** Code de SearchOptions.jobs. */
  job?: string;
  title?: string;
  summary?: string;
  city?: string;
  district?: string;
  experienceYears?: number;
  availability?: CandidateFeedItem['availability'];
  /** Salaire visé : critère de ciblage, jamais une garantie (§5). */
  salaryMin?: Amount;
  salaryMax?: Amount;
  skills?: string[];
  training?: string;
}

export type ServiceStructure = 'independant' | 'entreprise';

export interface ServiceDraftData {
  /** Code de SearchOptions.serviceCategories. */
  category?: string;
  structure?: ServiceStructure;
  businessName?: string;
  title?: string;
  description?: string;
  city?: string;
  priceFrom?: Amount;
}

export interface UploadedMedia {
  id: string;
  url: string;
  type: 'image';
}

/** Brouillon serveur : reprise possible sur un autre appareil. */
export interface PublishDraft {
  id: string;
  type: Universe | null;
  /** Dernière étape atteinte (0 type · 1 profil · 2 détails · 3 médias · 4 validation). */
  step: number;
  listing: ListingDraftData;
  candidate: CandidateDraftData;
  service: ServiceDraftData;
  /** Ordre = ordre d'affichage ; le premier est la couverture. */
  media: UploadedMedia[];
  /** Brouillon de modification d'une publication existante : la publication la met à jour. */
  sourceItemId?: string;
  /** Admin (permission add_property) publiant pour le compte d'un utilisateur. */
  onBehalfOf?: { userId: string; name: string };
  updatedAt: ISODate;
}

export type PublishDraftPatch = Partial<Omit<PublishDraft, 'id' | 'updatedAt'>>;

/**
 * - published      : en ligne immédiatement
 * - pending_review : en file de modération
 * - pending_kyc    : en attente de certification du compte (M07)
 */
export type PublishStatus = 'published' | 'pending_review' | 'pending_kyc';

export interface PublishResult {
  status: PublishStatus;
  universe: Universe;
  itemId: string;
}

/** Erreur de validation serveur (422) : `field` = nom du champ du brouillon. */
export interface FieldError {
  field: string;
  message: string;
}
