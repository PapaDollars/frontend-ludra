import api from '@/lib/api';
import { toQuery, withMock } from '@/lib/mock';
import * as m from '@/mocks/admin.mock';
import type {
  AdminKycDossier, AdminKycSummary, AdminListing, AdminListingStatus, AdminPayment, AdminProof, AdminReport, AdminReview,
  AdminSettings, AdminStats, AdminUser, ApiResponse, AuditEntry, CursorPage, DocumentView, KycDecision, KycStatus, ListingDecision,
  ProofDecision, QueueItem, ReportDecision, ReviewDecision,
} from '@/types';

const A = '/admin';
const enc = encodeURIComponent;
const qs = (o: object) => { const s = toQuery(o); return s ? `?${s}` : ''; };

/**
 * Back-office (M16). Toutes les routes : rôle admin/proprietaire + permission dédiée (RBAC serveur).
 * `actor` ne sert qu'aux mocks (le serveur identifie l'admin par son token) ; chaque décision est journalisée côté serveur.
 */
export const adminService = {
  /** GET /admin/stats — permission : aucune (tout admin). */
  stats() {
    return withMock(() => m.mockAdminStats(), async () => (await api.get<ApiResponse<AdminStats>>(`${A}/stats`)).data);
  },

  /** GET /admin/queue?kind= — file unifiée, filtrée selon les permissions de l'admin. */
  queue(kind?: QueueItem['kind']) {
    return withMock(() => m.mockQueue(kind), async () => (await api.get<ApiResponse<QueueItem[]>>(`${A}/queue${qs({ kind })}`)).data);
  },

  // ── KYC (review_kyc) ──
  kycList(status?: KycStatus) {
    return withMock(() => m.mockKycList(status), async () => (await api.get<ApiResponse<AdminKycSummary[]>>(`${A}/kyc${qs({ status })}`)).data);
  },
  kycDossier(userId: string) {
    return withMock(() => m.mockKycDossier(userId), async () => (await api.get<ApiResponse<AdminKycDossier>>(`${A}/kyc/${enc(userId)}`)).data);
  },
  /** GET /admin/kyc/:userId/documents/:docId/view — URL signée courte ; consultation journalisée. */
  viewDocument(actor: m.Actor, userId: string, docId: string) {
    return withMock(() => m.mockViewDocument(actor, userId, docId),
      async () => (await api.get<ApiResponse<DocumentView>>(`${A}/kyc/${enc(userId)}/documents/${enc(docId)}/view`)).data);
  },
  /** POST /admin/kyc/:userId/decision { decision, reason?, rejectedDocumentIds? } */
  kycDecision(actor: m.Actor, userId: string, decision: KycDecision, reason?: string, rejectedDocumentIds?: string[]) {
    return withMock(() => m.mockKycDecision(actor, userId, decision, reason, rejectedDocumentIds),
      async () => (await api.post<ApiResponse<AdminKycDossier>>(`${A}/kyc/${enc(userId)}/decision`, { decision, reason, rejectedDocumentIds })).data);
  },

  // ── Annonces (manage_properties) ──
  listings(opts: { status?: AdminListingStatus; q?: string; cursor?: string | null } = {}) {
    return withMock(() => m.mockAdminListings(opts), async () => (await api.get<ApiResponse<CursorPage<AdminListing>>>(`${A}/listings${qs(opts)}`)).data);
  },
  /** POST /admin/listings/:id/decision { decision, reason? } */
  listingDecision(actor: m.Actor, id: string, decision: ListingDecision, reason?: string) {
    return withMock(() => m.mockListingDecision(actor, id, decision, reason),
      async () => (await api.post<ApiResponse<AdminListing>>(`${A}/listings/${enc(id)}/decision`, { decision, reason })).data);
  },

  // ── Avis (moderate_reviews) ──
  reviews() {
    return withMock(() => m.mockAdminReviews(), async () => (await api.get<ApiResponse<AdminReview[]>>(`${A}/reviews?reported=true`)).data);
  },
  reviewDecision(actor: m.Actor, id: string, decision: ReviewDecision, reason?: string) {
    return withMock(() => m.mockReviewDecision(actor, id, decision, reason),
      async () => { await api.post(`${A}/reviews/${enc(id)}/decision`, { decision, reason }); });
  },

  // ── Signalements (handle_reports) ──
  reports(status: AdminReport['status'] = 'open') {
    return withMock(() => m.mockAdminReports(status), async () => (await api.get<ApiResponse<AdminReport[]>>(`${A}/reports${qs({ status })}`)).data);
  },
  reportDecision(actor: m.Actor, id: string, decision: ReportDecision, reason?: string) {
    return withMock(() => m.mockReportDecision(actor, id, decision, reason),
      async () => { await api.post(`${A}/reports/${enc(id)}/decision`, { decision, reason }); });
  },

  // ── Paiements (view_payments / manage_payments) ──
  payments(opts: { status?: string; purpose?: string } = {}) {
    return withMock(() => m.mockAdminPayments(opts), async () => (await api.get<ApiResponse<AdminPayment[]>>(`${A}/payments${qs(opts)}`)).data);
  },
  /** POST /admin/payments/:id/reconcile — interroge l'opérateur (paiement sans webhook). */
  reconcile(actor: m.Actor, id: string) {
    return withMock(() => m.mockReconcile(actor, id), async () => (await api.post<ApiResponse<AdminPayment>>(`${A}/payments/${enc(id)}/reconcile`)).data);
  },

  // ── Preuves Formé / habilitations (review_kyc) ──
  proofs(status: AdminProof['status'] = 'a_verifier') {
    return withMock(() => m.mockProofs(status), async () => (await api.get<ApiResponse<AdminProof[]>>(`${A}/proofs${qs({ status })}`)).data);
  },
  proofDecision(actor: m.Actor, id: string, decision: ProofDecision, reason?: string) {
    return withMock(() => m.mockProofDecision(actor, id, decision, reason),
      async () => { await api.post(`${A}/proofs/${enc(id)}/decision`, { decision, reason }); });
  },

  // ── Paramètres (manage_settings) ──
  settings() {
    return withMock(() => m.mockAdminSettings(), async () => (await api.get<ApiResponse<AdminSettings>>(`${A}/settings`)).data);
  },
  saveSettings(actor: m.Actor, next: AdminSettings) {
    return withMock(() => m.mockSaveSettings(actor, next), async () => (await api.put<ApiResponse<AdminSettings>>(`${A}/settings`, next)).data);
  },

  // ── Utilisateurs (manage_users ; rôle/permissions : add_admin) ──
  users(opts: { q?: string; role?: string; cursor?: string | null } = {}) {
    return withMock(() => m.mockAdminUsers(opts), async () => (await api.get<ApiResponse<CursorPage<AdminUser>>>(`${A}/users${qs(opts)}`)).data);
  },
  /** PATCH /admin/users/:id { role?, adminPermissions?, isActive?, reason? } — motif obligatoire pour une suspension. */
  updateUser(actor: m.Actor, id: string, patch: Partial<Pick<AdminUser, 'role' | 'adminPermissions' | 'isActive'>>, reason?: string) {
    return withMock(() => m.mockUpdateUser(actor, id, patch, reason),
      async () => (await api.patch<ApiResponse<AdminUser>>(`${A}/users/${enc(id)}`, { ...patch, reason })).data);
  },

  // ── Journal (view_audit) ──
  audit(opts: { q?: string; action?: string; cursor?: string | null } = {}) {
    return withMock(() => m.mockAudit(opts), async () => (await api.get<ApiResponse<CursorPage<AuditEntry>>>(`${A}/audit${qs(opts)}`)).data);
  },
};
