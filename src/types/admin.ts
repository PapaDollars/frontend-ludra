// types/admin.ts — Module 16 : Back-office & modération
import type { Amount, CursorPage, ISODate } from './common';
import type { FeedItem } from './feed';
import type { KycDossier, KycProfile, KycStatus } from './kyc';
import type { PaymentRecord } from './account';
import type { Plan } from './subscription';
import type { Review } from './review';
import type { ReportReason, ReportTargetType } from './report';
import type { ServiceCategory } from './services';

/**
 * Permissions admin (rôle `admin`). Le rôle `proprietaire` (compte principal) les a toutes.
 * Les 4 premières existent déjà en V1.
 */
export type AdminPermission =
  | 'manage_users' | 'add_admin' | 'manage_properties' | 'add_property'
  | 'review_kyc' | 'moderate_reviews' | 'handle_reports' | 'view_payments' | 'manage_payments'
  | 'manage_settings' | 'view_audit';

export interface AdminStats {
  users: number;
  usersNew7d: number;
  pendingKyc: number;
  pendingListings: number;
  openReports: number;
  pendingProofs: number;
  paymentsToday: Amount;
  paymentsTodayCount: number;
  failedPayments24h: number;
}

// ── File de modération unifiée ──
export type QueueKind = 'kyc' | 'listing' | 'review' | 'report' | 'payment' | 'proof';
export type QueueStatus = 'a_verifier' | 'a_revoir' | 'valide' | 'rejete';

export interface QueueItem {
  id: string;
  kind: QueueKind;
  /** Référence lisible, ex. "#IM-2031". */
  ref: string;
  title: string;
  subtitle: string;
  priority: 'normal' | 'high';
  status: QueueStatus;
  createdAt: ISODate;
  /** Id de l'objet à ouvrir dans la file spécialisée. */
  targetId: string;
}

// ── KYC ──
export interface AdminKycSummary {
  userId: string;
  userName: string;
  profile: KycProfile | null;
  status: KycStatus;
  submittedAt?: ISODate;
  documentsCount: number;
}

export interface AdminKycDossier extends KycDossier {
  userId: string;
  userName: string;
  userEmail: string;
}

export type KycDecision = 'start_review' | 'approve' | 'reject';

/** URL signée à durée de vie courte pour consulter une pièce (consultation journalisée). */
export interface DocumentView {
  url: string;
  mimeType: string;
  expiresAt: ISODate;
}

// ── Annonces ──
export type AdminListingStatus = 'active' | 'pending_review' | 'pending_kyc' | 'paused' | 'rented' | 'archived' | 'suspended' | 'rejected';
export type ListingDecision = 'approve' | 'reject' | 'suspend' | 'restore' | 'sponsor' | 'unsponsor';

export interface AdminListing {
  item: FeedItem;
  status: AdminListingStatus;
  reportsCount: number;
  publisherEmail: string;
  updatedAt: ISODate;
}

// ── Avis & signalements ──
export interface AdminReview {
  review: Review;
  subjectName: string;
  reportsCount: number;
  reasons: ReportReason[];
}
export type ReviewDecision = 'keep' | 'remove';

export interface AdminReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  details?: string;
  reporterName: string;
  createdAt: ISODate;
  status: 'open' | 'resolved' | 'dismissed';
  /** Nombre total de signalements visant la même cible. */
  reportsOnTarget: number;
}
export type ReportDecision = 'dismiss' | 'remove_content' | 'warn_user' | 'suspend_user';

// ── Paiements ──
export interface AdminPayment extends PaymentRecord {
  userName: string;
  webhook: 'received' | 'missing' | 'invalid_signature';
  operatorReference?: string;
}

// ── Preuves (badge Formé, habilitations professionnelles) ──
export interface AdminProof {
  id: string;
  kind: 'training' | 'habilitation';
  userName: string;
  itemId: string;
  itemTitle: string;
  label: string;
  submittedAt: ISODate;
  status: 'a_verifier' | 'valide' | 'rejete';
}
export type ProofDecision = 'approve' | 'reject';

// ── Paramètres administrables ──
export interface AdminSettings {
  contactUnlock: { min: Amount; max: Amount; price: Amount };
  plans: (Plan & { active: boolean })[];
  ranking: {
    /** Part minimale de résultats organiques (non sponsorisés) dans une page, en %. */
    organicQuotaPercent: number;
    /** Bonus de classement maximal accordé par un plan payant, en % du score de pertinence. */
    maxPlanBoostPercent: number;
  };
  serviceCategories: (ServiceCategory & { active: boolean })[];
}

// ── Utilisateurs ──
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'landlord' | 'admin' | 'proprietaire';
  adminPermissions: AdminPermission[];
  isActive: boolean;
  kycStatus: KycStatus;
  createdAt: ISODate;
}

// ── Journal d'audit ──
export interface AuditEntry {
  id: string;
  at: ISODate;
  actor: { id: string; name: string; role: string };
  /** Ex. "kyc.approve", "listing.suspend", "settings.update", "document.view". */
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  reason?: string;
  /** Détails (ancienne / nouvelle valeur…). */
  changes?: { field: string; from: string; to: string }[];
}

/** Toute décision admin : motif obligatoire pour les décisions négatives. */
export interface DecisionInput<D extends string> {
  decision: D;
  reason?: string;
}

export type AdminPage<T> = CursorPage<T>;

