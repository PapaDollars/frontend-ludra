// types/kyc.ts — Module 07 : Certification Propriétaire / Agent
import type { ISODate } from './common';

/** Statuts du dossier (dossier technique M07). */
export type KycStatus = 'a_completer' | 'soumis' | 'en_revue' | 'verifie' | 'rejete' | 'expire';

export type KycProfile = 'owner' | 'agent';

export type KycDocumentType =
  | 'identity'           // CNI recto / verso
  | 'property_proof'     // titre, attestation, justificatif lié au bien (propriétaire)
  | 'professional_card'  // carte professionnelle (agent)
  | 'mandate';           // mandat ou preuve de qualité (agent)

/**
 * Pièce déposée. Aucune URL : les scans sont privés et chiffrés,
 * consultables uniquement par l'équipe de vérification (back-office).
 */
export interface KycDocument {
  id: string;
  type: KycDocumentType;
  side?: 'recto' | 'verso';
  fileName: string;
  uploadedAt: ISODate;
  status: 'uploaded' | 'accepted' | 'rejected';
  rejectionReason?: string;
}

/** Bien / lieu déclaré : quartier + point carte. */
export interface KycLocation {
  city: string;
  district: string;
  latitude?: number;
  longitude?: number;
}

export interface KycHistoryEntry {
  status: KycStatus;
  at: ISODate;
  /** Motif visible par l'utilisateur (ex. raison du rejet). */
  note?: string;
}

export interface KycDossier {
  profile: KycProfile | null;
  status: KycStatus;
  documents: KycDocument[];
  locations: KycLocation[];
  submittedAt?: ISODate;
  reviewedAt?: ISODate;
  /** Fin de validité de la certification. */
  expiresAt?: ISODate;
  rejectionReason?: string;
  /** Badge public "Identité vérifiée" effectivement affiché (calculé serveur). */
  badgeActive: boolean;
  history: KycHistoryEntry[];
}
