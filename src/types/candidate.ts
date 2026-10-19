// types/candidate.ts — Modules 10 à 13 : placement du personnel
import type { ISODate } from './common';
import type { CandidateFeedItem } from './feed';

/** Droits du visiteur sur un profil candidat (calculés serveur selon son forfait recruteur). */
export interface CandidateViewerAccess {
  canContact: boolean;
  canShortlist: boolean;
  shortlisted: boolean;
  /** Raison du blocage : non connecté, aucun forfait, forfait insuffisant. */
  reason?: 'login' | 'no_plan' | 'plan_too_low';
}

/**
 * Profil candidat public (M11).
 * Jamais : téléphone, adresse, âge, situation familiale, religion, ethnie, santé, documents.
 */
export interface CandidateDetail extends CandidateFeedItem {
  summary: string;
  skills: string[];
  training?: string;
  /** Ex. "B - valide". */
  license?: string;
  references: { total: number; verified: number };
  badges: { identityVerified: boolean; trained: boolean };
  viewerAccess: CandidateViewerAccess;
  viewerIsOwner: boolean;
}

/** Droits ouverts par le forfait recruteur actif (M13). */
export interface RecruiterRights {
  /** Accès aux meilleurs profils + contact. */
  contact: boolean;
  advancedFilters: boolean;
  shortlist: boolean;
  /** Priorité aux profils formés + badges de formation vérifiée. */
  trainedPriority: boolean;
  exportShortlist: boolean;
  assistedPreselection: boolean;
  prioritySupport: boolean;
}

export interface RecruiterAccess {
  planCode: string | null;
  planName: string | null;
  expiresAt: ISODate | null;
  rights: RecruiterRights;
  shortlistCount: number;
}

export interface ShortlistEntry {
  candidate: CandidateFeedItem;
  addedAt: ISODate;
}
