// mocks/admin.mock.ts — Back-office & modération (démo)
//
// Toute décision ajoute une entrée au journal d'audit (acteur, action, cible, motif, changements).
// Les paramètres (prix, plans, classement, catégories) modifient réellement les autres mocks.
import { ApiError } from '@/lib/api';
import type {
  AdminKycDossier, AdminKycSummary, AdminListing, AdminListingStatus, AdminPayment, AdminProof, AdminReport, AdminReview,
  AdminSettings, AdminStats, AdminUser, AuditEntry, CursorPage, DocumentView, FeedItem, KycDecision, KycStatus, ListingDecision,
  ProofDecision, QueueItem, ReportDecision, ReviewDecision,
} from '@/types';
import { FEED_ITEMS, MOCK_ME, addFeedItem } from './feed.mock';
import { mockPaymentHistory } from './payment.mock';
import { PLANS, effectivePlan } from './subscription.mock';
import { mockAllServiceCategories } from './services.mock';
import { reportsStore } from './reports.mock';
import { settingsStore } from './settings.mock';
import { persisted } from './storage';

export interface Actor { id: string; name: string; role: string }

const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const now = () => new Date().toISOString();

const page = <T,>(all: T[], cursor?: string | null, limit = 20): CursorPage<T> => {
  const start = cursor ? Number(cursor) : 0;
  const next = start + limit;
  return { items: all.slice(start, next), nextCursor: next < all.length ? String(next) : null, total: all.length };
};

const requireReason = (negative: boolean, reason?: string) => {
  if (negative && (!reason || reason.trim().length < 5)) {
    throw new ApiError('Motif obligatoire (5 caractères minimum).', 422, 'VALIDATION_ERROR', [{ field: 'reason', message: 'Motif obligatoire.' }]);
  }
};

// ── Journal d'audit ──
const audit = persisted<AuditEntry[]>('ludra.mock.audit', () => [
  { id: 'au-1', at: ago(26), actor: { id: 'adm-1', name: 'Admin Ludra', role: 'proprietaire' }, action: 'settings.update', targetType: 'settings', targetId: 'pricing', targetLabel: 'Déblocage contact', changes: [{ field: 'price', from: '300', to: '500' }] },
  { id: 'au-2', at: ago(30), actor: { id: 'adm-2', name: 'Grace M.', role: 'admin' }, action: 'kyc.approve', targetType: 'user', targetId: 'u-mboa', targetLabel: 'Mboa Nest' },
  { id: 'au-3', at: ago(50), actor: { id: 'adm-2', name: 'Grace M.', role: 'admin' }, action: 'listing.reject', targetType: 'listing', targetId: 'l-x', targetLabel: 'Duplex à Ngousso', reason: 'Photos issues d’une autre annonce.' },
]);

function log(actor: Actor, action: string, targetType: string, targetId: string, targetLabel: string, reason?: string, changes?: AuditEntry['changes']) {
  audit.set([{ id: `au-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: now(), actor, action, targetType, targetId, targetLabel, ...(reason ? { reason } : {}), ...(changes?.length ? { changes } : {}) }, ...audit.get()]);
}

export function mockAudit(opts: { q?: string; action?: string; cursor?: string | null }): CursorPage<AuditEntry> {
  const q = opts.q?.toLowerCase();
  const list = audit.get()
    .filter((a) => !opts.action || a.action.startsWith(opts.action))
    .filter((a) => !q || `${a.actor.name} ${a.targetLabel} ${a.action} ${a.reason ?? ''}`.toLowerCase().includes(q));
  return page(list, opts.cursor, 30);
}

// ── KYC ──
const kycStore = persisted<AdminKycDossier[]>('ludra.mock.admin.kyc', () => [
  {
    userId: 'u-agent-188', userName: 'Agence Horizon', userEmail: 'contact@horizon.cm', profile: 'agent', status: 'soumis', badgeActive: false,
    submittedAt: ago(5),
    documents: [
      { id: 'd1', type: 'identity', side: 'recto', fileName: 'cni-recto.jpg', uploadedAt: ago(6), status: 'uploaded' },
      { id: 'd2', type: 'identity', side: 'verso', fileName: 'cni-verso.jpg', uploadedAt: ago(6), status: 'uploaded' },
      { id: 'd3', type: 'professional_card', fileName: 'carte-pro.pdf', uploadedAt: ago(6), status: 'uploaded' },
    ],
    locations: [{ city: 'Yaoundé', district: 'Bastos', latitude: 3.889, longitude: 11.514 }, { city: 'Yaoundé', district: 'Odza' }],
    history: [{ status: 'a_completer', at: ago(48) }, { status: 'soumis', at: ago(5) }],
  },
  {
    userId: 'u-paul', userName: 'Paul T.', userEmail: 'paul.t@mail.cm', profile: 'owner', status: 'en_revue', badgeActive: false,
    submittedAt: ago(20),
    documents: [
      { id: 'd4', type: 'identity', side: 'recto', fileName: 'id-front.png', uploadedAt: ago(21), status: 'uploaded' },
      { id: 'd5', type: 'identity', side: 'verso', fileName: 'id-back.png', uploadedAt: ago(21), status: 'uploaded' },
      { id: 'd6', type: 'property_proof', fileName: 'titre-foncier-lendi.pdf', uploadedAt: ago(21), status: 'uploaded' },
    ],
    locations: [{ city: 'Douala', district: 'Lendi' }],
    history: [{ status: 'a_completer', at: ago(72) }, { status: 'soumis', at: ago(20) }, { status: 'en_revue', at: ago(2) }],
  },
]);

export const mockKycList = (status?: KycStatus): AdminKycSummary[] =>
  kycStore.get().filter((d) => !status || d.status === status).map((d) => ({
    userId: d.userId, userName: d.userName, profile: d.profile, status: d.status, submittedAt: d.submittedAt, documentsCount: d.documents.length,
  }));

export function mockKycDossier(userId: string): AdminKycDossier {
  const d = kycStore.get().find((x) => x.userId === userId);
  if (!d) throw new ApiError('Dossier introuvable', 404, 'NOT_FOUND');
  return d;
}

export function mockViewDocument(actor: Actor, userId: string, docId: string): DocumentView {
  const d = mockKycDossier(userId);
  const doc = d.documents.find((x) => x.id === docId);
  if (!doc) throw new ApiError('Pièce introuvable', 404, 'NOT_FOUND');
  log(actor, 'document.view', 'kyc_document', docId, `${d.userName} — ${doc.fileName}`);
  // Image de démo : la vraie pièce est servie par une URL signée de courte durée.
  return { url: 'https://images.unsplash.com/photo-1586282391129-76a6df230234?w=900&fit=crop', mimeType: 'image/jpeg', expiresAt: new Date(Date.now() + 5 * 60_000).toISOString() };
}

export function mockKycDecision(actor: Actor, userId: string, decision: KycDecision, reason?: string, rejectedDocumentIds: string[] = []): AdminKycDossier {
  requireReason(decision === 'reject', reason);
  const d = mockKycDossier(userId);
  const status: KycStatus = decision === 'start_review' ? 'en_revue' : decision === 'approve' ? 'verifie' : 'rejete';
  const next: AdminKycDossier = {
    ...d, status, reviewedAt: decision === 'start_review' ? d.reviewedAt : now(),
    ...(decision === 'approve' ? { expiresAt: new Date(Date.now() + 365 * 86_400_000).toISOString(), rejectionReason: undefined } : {}),
    ...(decision === 'reject' ? { rejectionReason: reason } : {}),
    documents: d.documents.map((doc) => (decision === 'approve'
      ? { ...doc, status: 'accepted' }
      : decision === 'reject' && rejectedDocumentIds.includes(doc.id) ? { ...doc, status: 'rejected', rejectionReason: reason } : doc)),
    history: [...d.history, { status, at: now(), ...(reason ? { note: reason } : {}) }],
  };
  kycStore.set(kycStore.get().map((x) => (x.userId === userId ? next : x)));
  log(actor, `kyc.${decision}`, 'user', userId, d.userName, reason);
  return next;
}

// ── Annonces ──
const pendingListings = persisted<FeedItem[]>('ludra.mock.admin.pendingListings', () => [
  {
    id: 'l-im-2031', universe: 'immobilier', publisher: { id: 'u-agent-188', name: 'Agence Horizon', kind: 'agent', verified: false, city: 'Yaoundé' },
    title: 'Duplex 3 chambres à Odza', city: 'Yaoundé', district: 'Odza', media: [{ url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&h=560&fit=crop', type: 'image' }],
    createdAt: ago(4), isFavorite: false, sponsored: false, transaction: 'location', propertyKind: 'maison', price: 250000, priceUnit: 'mois',
    bedrooms: 3, bathrooms: 2, surface: 160, amenities: ['parking'], availableNow: true,
  },
]);
const listingStatus = persisted<Record<string, AdminListingStatus>>('ludra.mock.admin.listingStatus', () => ({ 'l-im-2031': 'pending_kyc' }));

const allListings = () => [...pendingListings.get(), ...FEED_ITEMS.filter((i) => !pendingListings.get().some((p) => p.id === i.id))];

export function mockAdminListings(opts: { status?: AdminListingStatus; q?: string; cursor?: string | null }): CursorPage<AdminListing> {
  const reports = reportsStore.get();
  const q = opts.q?.toLowerCase();
  const list = allListings()
    .map((item): AdminListing => ({
      item, status: listingStatus.get()[item.id] ?? 'active',
      reportsCount: reports.filter((r) => r.targetId === item.id && r.status === 'open').length,
      publisherEmail: `${item.publisher.id.replace('u-', '')}@exemple.cm`, updatedAt: item.createdAt,
    }))
    .filter((l) => !opts.status || l.status === opts.status)
    .filter((l) => !q || `${l.item.title} ${l.item.publisher.name} ${l.item.city}`.toLowerCase().includes(q))
    .sort((a, b) => b.reportsCount - a.reportsCount || b.updatedAt.localeCompare(a.updatedAt));
  return page(list, opts.cursor);
}

export function mockListingDecision(actor: Actor, id: string, decision: ListingDecision, reason?: string): AdminListing {
  requireReason(decision === 'reject' || decision === 'suspend', reason);
  const item = allListings().find((i) => i.id === id);
  if (!item) throw new ApiError('Annonce introuvable', 404, 'NOT_FOUND');
  const prev = listingStatus.get()[id] ?? 'active';
  const map: Partial<Record<ListingDecision, AdminListingStatus>> = { approve: 'active', reject: 'rejected', suspend: 'suspended', restore: 'active' };
  if (map[decision]) listingStatus.set({ ...listingStatus.get(), [id]: map[decision]! });
  if (decision === 'sponsor' || decision === 'unsponsor') item.sponsored = decision === 'sponsor';
  // Annonce approuvée : publiée dans le feed de démo.
  if (decision === 'approve' && pendingListings.get().some((p) => p.id === id)) {
    pendingListings.set(pendingListings.get().filter((p) => p.id !== id));
    addFeedItem(item);
  }
  log(actor, `listing.${decision}`, 'listing', id, item.title, reason, map[decision] ? [{ field: 'status', from: prev, to: map[decision]! }] : undefined);
  return mockAdminListings({}).items.find((l) => l.item.id === id) ?? { item, status: map[decision] ?? prev, reportsCount: 0, publisherEmail: '', updatedAt: now() };
}

/** Visibilité publique tenant compte des décisions de modération (feed / recherche). */
export const isModerationVisible = (item: FeedItem) => !['suspended', 'rejected'].includes(listingStatus.get()[item.id] ?? 'active');

// ── Avis signalés ──
const reviewsStore = persisted<(AdminReview & { removed?: boolean })[]>('ludra.mock.admin.reviews', () => [
  {
    review: { id: 'rv-rep-1', author: { id: 'a-x', name: 'Rival I.' }, subjectId: 'u-mboa', rating: 1, comment: 'Agence d’arnaqueurs, fuyez !!!', interactionKind: 'conversation', context: null, createdAt: ago(12), reply: null, mine: false, canReply: false },
    subjectName: 'Mboa Nest', reportsCount: 3, reasons: ['contenu_inapproprie', 'autre'],
  },
  {
    review: { id: 'rv-rep-2', author: { id: 'a-y', name: 'Ali B.' }, subjectId: 'u-nadia', rating: 2, comment: 'Visite annulée au dernier moment.', interactionKind: 'contact_unlock', context: null, createdAt: ago(40), reply: { text: 'Imprévu familial, désolée.', createdAt: ago(38) }, mine: false, canReply: false },
    subjectName: 'Nadia L.', reportsCount: 1, reasons: ['autre'],
  },
]);

export const mockAdminReviews = (): AdminReview[] => reviewsStore.get().filter((r) => !r.removed);

export function mockReviewDecision(actor: Actor, id: string, decision: ReviewDecision, reason?: string) {
  requireReason(decision === 'remove', reason);
  const r = reviewsStore.get().find((x) => x.review.id === id);
  if (!r) throw new ApiError('Avis introuvable', 404, 'NOT_FOUND');
  reviewsStore.set(reviewsStore.get().map((x) => (x.review.id === id ? { ...x, removed: true, reportsCount: decision === 'keep' ? 0 : x.reportsCount } : x)));
  log(actor, `review.${decision}`, 'review', id, `Avis de ${r.review.author.name} sur ${r.subjectName}`, reason);
}

// ── Signalements ──
export const mockAdminReports = (status: AdminReport['status'] = 'open') => reportsStore.get().filter((r) => r.status === status);

export function mockReportDecision(actor: Actor, id: string, decision: ReportDecision, reason?: string) {
  requireReason(decision !== 'dismiss', reason);
  const r = reportsStore.get().find((x) => x.id === id);
  if (!r) throw new ApiError('Signalement introuvable', 404, 'NOT_FOUND');
  reportsStore.set(reportsStore.get().map((x) => (x.id === id ? { ...x, status: decision === 'dismiss' ? 'dismissed' : 'resolved' } : x)));
  if (decision === 'remove_content' && r.targetType === 'listing') listingStatus.set({ ...listingStatus.get(), [r.targetId]: 'suspended' });
  if (decision === 'suspend_user') usersStore.set(usersStore.get().map((u) => (u.id === r.targetId ? { ...u, isActive: false } : u)));
  log(actor, `report.${decision}`, r.targetType, r.targetId, r.targetLabel, reason);
}

// ── Paiements ──
const seededPayments: AdminPayment[] = [
  { id: 'pay-p-992', purpose: 'unlock_contact', status: 'paid', amount: 500, currency: 'XAF', operator: 'mtn_momo', createdAt: ago(1), paidAt: ago(1), label: 'Déblocage contact — Appartement moderne à Bastos', receiptNumber: 'LUD-P992', userName: 'Serge N.', webhook: 'received', operatorReference: 'MP231015.1203.A1' },
  { id: 'pay-p-993', purpose: 'subscription', status: 'pending', amount: 10000, currency: 'XAF', operator: 'orange_money', createdAt: ago(3), label: 'Abonnement Pro — Propriétaire / Agent', userName: 'Agence Horizon', webhook: 'missing' },
  { id: 'pay-p-994', purpose: 'unlock_contact', status: 'failed', amount: 500, currency: 'XAF', operator: 'mtn_momo', createdAt: ago(6), label: 'Déblocage contact — Villa 4 chambres', userName: 'Linda F.', webhook: 'received', failureReason: 'Solde insuffisant' },
  { id: 'pay-p-995', purpose: 'subscription', status: 'paid', amount: 8000, currency: 'XAF', operator: 'orange_money', createdAt: ago(8), paidAt: ago(8), label: 'Plan Formé — Recruteur', receiptNumber: 'LUD-P995', userName: 'Société Akwa Services', webhook: 'received', operatorReference: 'OM8812345' },
];
const reconciled = persisted<Record<string, Partial<AdminPayment>>>('ludra.mock.admin.payments', () => ({}));

export function mockAdminPayments(opts: { status?: string; purpose?: string }): AdminPayment[] {
  const mine: AdminPayment[] = mockPaymentHistory().map((p) => ({ ...p, userName: 'Utilisateur démo', webhook: p.status === 'pending' ? 'missing' : 'received' }));
  return [...mine, ...seededPayments]
    .map((p) => ({ ...p, ...reconciled.get()[p.id] }))
    .filter((p) => !opts.status || p.status === opts.status)
    .filter((p) => !opts.purpose || p.purpose === opts.purpose)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Interroge l'opérateur pour un paiement sans webhook (simulé : confirmé). */
export function mockReconcile(actor: Actor, id: string): AdminPayment {
  const p = mockAdminPayments({}).find((x) => x.id === id);
  if (!p) throw new ApiError('Paiement introuvable', 404, 'NOT_FOUND');
  if (p.status !== 'pending') throw new ApiError('Seuls les paiements en attente peuvent être rapprochés.', 409, 'INVALID_STATE');
  const patch: Partial<AdminPayment> = { status: 'paid', paidAt: now(), webhook: 'received', receiptNumber: `LUD-${id.slice(-4).toUpperCase()}`, operatorReference: `RECON-${Date.now().toString().slice(-6)}` };
  reconciled.set({ ...reconciled.get(), [id]: patch });
  log(actor, 'payment.reconcile', 'payment', id, p.label, undefined, [{ field: 'status', from: 'pending', to: 'paid' }]);
  return { ...p, ...patch };
}

// ── Preuves (Formé, habilitations) ──
const proofs = persisted<AdminProof[]>('ludra.mock.admin.proofs', () => [
  { id: 'pr-1', kind: 'training', userName: 'Marc A.', itemId: 'c-005', itemTitle: 'Auxiliaire de vie, accompagnement personnes âgées', label: 'Attestation premiers secours (PSC1)', submittedAt: ago(7), status: 'a_verifier' },
  { id: 'pr-2', kind: 'training', userName: 'Jean-Paul M.', itemId: 'c-002', itemTitle: 'Chauffeur poids léger, disponible', label: 'Certificat conduite défensive', submittedAt: ago(15), status: 'a_verifier' },
  { id: 'pr-3', kind: 'habilitation', userName: 'Cabinet GéoMesure', itemId: 's-009', itemTitle: 'Géomètre expert — bornage', label: 'Inscription à l’Ordre des géomètres n° 0457', submittedAt: ago(22), status: 'a_verifier' },
]);

export const mockProofs = (status: AdminProof['status'] = 'a_verifier') => proofs.get().filter((p) => p.status === status);

export function mockProofDecision(actor: Actor, id: string, decision: ProofDecision, reason?: string) {
  requireReason(decision === 'reject', reason);
  const p = proofs.get().find((x) => x.id === id);
  if (!p) throw new ApiError('Preuve introuvable', 404, 'NOT_FOUND');
  proofs.set(proofs.get().map((x) => (x.id === id ? { ...x, status: decision === 'approve' ? 'valide' : 'rejete' } : x)));
  if (decision === 'approve' && p.kind === 'training') {
    const item = FEED_ITEMS.find((i) => i.id === p.itemId);
    if (item?.universe === 'personnel') item.trained = true;
  }
  log(actor, `proof.${decision}`, p.kind, p.itemId, `${p.userName} — ${p.label}`, reason);
}

// ── Paramètres ──
export function mockAdminSettings(): AdminSettings {
  const s = settingsStore.get();
  return {
    contactUnlock: s.contactUnlock,
    plans: PLANS.map(effectivePlan),
    ranking: s.ranking,
    serviceCategories: mockAllServiceCategories(),
  };
}

export function mockSaveSettings(actor: Actor, next: AdminSettings): AdminSettings {
  const { min, max, price } = next.contactUnlock;
  if (price < min || price > max) {
    throw new ApiError(`Le prix du déblocage doit rester entre ${min} et ${max} FCFA.`, 422, 'VALIDATION_ERROR', [{ field: 'contactUnlock.price', message: `Entre ${min} et ${max} FCFA.` }]);
  }
  if (next.plans.some((p) => p.price < 0)) throw new ApiError('Prix de plan invalide.', 422, 'VALIDATION_ERROR');
  if (next.ranking.organicQuotaPercent < 50) throw new ApiError('Le quota organique ne peut pas descendre sous 50 %.', 422, 'VALIDATION_ERROR', [{ field: 'ranking.organicQuotaPercent', message: '50 % minimum.' }]);

  const prev = mockAdminSettings();
  const changes: { field: string; from: string; to: string }[] = [];
  if (prev.contactUnlock.price !== price) changes.push({ field: 'Déblocage contact', from: String(prev.contactUnlock.price), to: String(price) });
  next.plans.forEach((p) => {
    const old = prev.plans.find((x) => x.code === p.code);
    if (!old) return;
    if (old.price !== p.price) changes.push({ field: `Plan ${p.name} (${p.audience})`, from: String(old.price), to: String(p.price) });
    if (old.active !== p.active) changes.push({ field: `Plan ${p.name} actif`, from: String(old.active), to: String(p.active) });
    if (old.recommended !== p.recommended) changes.push({ field: `Plan ${p.name} conseillé`, from: String(old.recommended), to: String(p.recommended) });
  });
  if (prev.ranking.organicQuotaPercent !== next.ranking.organicQuotaPercent) changes.push({ field: 'Quota organique %', from: String(prev.ranking.organicQuotaPercent), to: String(next.ranking.organicQuotaPercent) });
  if (prev.ranking.maxPlanBoostPercent !== next.ranking.maxPlanBoostPercent) changes.push({ field: 'Bonus plan max %', from: String(prev.ranking.maxPlanBoostPercent), to: String(next.ranking.maxPlanBoostPercent) });
  next.serviceCategories.forEach((c) => {
    const old = prev.serviceCategories.find((x) => x.code === c.code);
    if (old && old.active !== c.active) changes.push({ field: `Catégorie ${c.label}`, from: old.active ? 'active' : 'inactive', to: c.active ? 'active' : 'inactive' });
  });

  settingsStore.set({
    contactUnlock: next.contactUnlock,
    plans: Object.fromEntries(next.plans.map((p) => [p.code, { price: p.price, active: p.active, recommended: p.recommended, features: p.features }])),
    ranking: next.ranking,
    categoriesActive: Object.fromEntries(next.serviceCategories.map((c) => [c.code, c.active])),
  });
  if (changes.length) log(actor, 'settings.update', 'settings', 'product', 'Paramètres produit', undefined, changes);
  return mockAdminSettings();
}

// ── Utilisateurs ──
const usersStore = persisted<AdminUser[]>('ludra.mock.admin.users', () => {
  const pubs = new Map<string, AdminUser>();
  FEED_ITEMS.forEach(({ publisher: p }) => {
    if (pubs.has(p.id)) return;
    pubs.set(p.id, {
      id: p.id, name: p.name, email: `${p.id.replace('u-', '')}@exemple.cm`,
      role: p.kind === 'owner' || p.kind === 'agent' ? 'landlord' : 'user', adminPermissions: [], isActive: true,
      kycStatus: p.verified ? 'verifie' : 'a_completer', createdAt: ago(24 * (20 + pubs.size * 7)),
    });
  });
  const staff: AdminUser[] = [
    { id: 'adm-1', name: 'Admin Ludra', email: 'ludra.home@gmail.com', role: 'proprietaire', adminPermissions: [], isActive: true, kycStatus: 'verifie', createdAt: ago(24 * 400) },
    { id: 'adm-2', name: 'Grace M.', email: 'grace@ludra.cm', role: 'admin', adminPermissions: ['review_kyc', 'manage_properties', 'moderate_reviews', 'handle_reports'], isActive: true, kycStatus: 'verifie', createdAt: ago(24 * 120) },
    { id: MOCK_ME.id, name: 'Utilisateur démo', email: 'vous@exemple.cm', role: 'user', adminPermissions: [], isActive: true, kycStatus: 'a_completer', createdAt: ago(24 * 200) },
  ];
  return [...staff, ...pubs.values()].filter((u, i, all) => all.findIndex((x) => x.id === u.id) === i);
});

export function mockAdminUsers(opts: { q?: string; role?: string; cursor?: string | null }): CursorPage<AdminUser> {
  const q = opts.q?.toLowerCase();
  return page(usersStore.get()
    .filter((u) => !opts.role || u.role === opts.role)
    .filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q)), opts.cursor);
}

export function mockUpdateUser(actor: Actor, id: string, patch: Partial<Pick<AdminUser, 'role' | 'adminPermissions' | 'isActive'>>, reason?: string): AdminUser {
  const u = usersStore.get().find((x) => x.id === id);
  if (!u) throw new ApiError('Utilisateur introuvable', 404, 'NOT_FOUND');
  if (u.role === 'proprietaire') throw new ApiError('Le compte principal ne peut pas être modifié.', 403, 'FORBIDDEN');
  if (patch.isActive === false) requireReason(true, reason);
  const next = { ...u, ...patch };
  usersStore.set(usersStore.get().map((x) => (x.id === id ? next : x)));
  const changes = (Object.keys(patch) as (keyof typeof patch)[]).map((k) => ({ field: k, from: String(u[k]), to: String(next[k]) }));
  log(actor, patch.isActive === false ? 'user.suspend' : patch.isActive === true ? 'user.restore' : 'user.update', 'user', id, u.name, reason, changes);
  return next;
}

// ── Tableau de bord + file unifiée ──
export function mockAdminStats(): AdminStats {
  const today = new Date().toDateString();
  const payments = mockAdminPayments({});
  const paidToday = payments.filter((p) => p.status === 'paid' && new Date(p.paidAt ?? p.createdAt).toDateString() === today);
  return {
    users: 1248 + usersStore.get().length,
    usersNew7d: 63,
    pendingKyc: kycStore.get().filter((d) => d.status === 'soumis' || d.status === 'en_revue').length,
    pendingListings: mockAdminListings({ status: 'pending_review' }).total! + mockAdminListings({ status: 'pending_kyc' }).total!,
    openReports: mockAdminReports().length + mockAdminReviews().length,
    pendingProofs: mockProofs().length,
    paymentsToday: paidToday.reduce((n, p) => n + p.amount, 0),
    paymentsTodayCount: paidToday.length,
    failedPayments24h: payments.filter((p) => p.status === 'failed').length,
  };
}

export function mockQueue(kind?: QueueItem['kind']): QueueItem[] {
  const items: QueueItem[] = [
    ...kycStore.get().filter((d) => d.status === 'soumis' || d.status === 'en_revue').map((d): QueueItem => ({
      id: `q-kyc-${d.userId}`, kind: 'kyc', ref: `#${d.profile === 'agent' ? 'AG' : 'PR'}-${d.userId.slice(-3).toUpperCase()}`,
      title: d.userName, subtitle: d.profile === 'agent' ? 'Carte professionnelle' : 'Justificatif du bien', priority: 'normal',
      status: d.status === 'soumis' ? 'a_verifier' : 'a_revoir', createdAt: d.submittedAt ?? now(), targetId: d.userId,
    })),
    ...mockAdminListings({}).items.filter((l) => l.status.startsWith('pending') || l.reportsCount > 0).map((l): QueueItem => ({
      id: `q-l-${l.item.id}`, kind: 'listing', ref: `#IM-${l.item.id.replace(/\D/g, '').slice(-4) || '0000'}`, title: l.item.title,
      subtitle: l.reportsCount ? `${l.reportsCount} signalement(s)` : 'Nouvelle annonce', priority: l.reportsCount > 1 ? 'high' : 'normal',
      status: 'a_verifier', createdAt: l.updatedAt, targetId: l.item.id,
    })),
    ...mockAdminReviews().map((r): QueueItem => ({
      id: `q-r-${r.review.id}`, kind: 'review', ref: `#AV-${r.review.id.replace(/\D/g, '').padStart(3, '0')}`, title: `Avis sur ${r.subjectName}`,
      subtitle: 'Avis signalé', priority: r.reportsCount > 1 ? 'high' : 'normal', status: 'a_verifier', createdAt: r.review.createdAt, targetId: r.review.id,
    })),
    ...mockAdminReports().map((r): QueueItem => ({
      id: `q-rp-${r.id}`, kind: 'report', ref: `#SG-${r.id.replace(/\D/g, '').slice(-4).padStart(3, '0')}`, title: r.targetLabel,
      subtitle: `Signalement : ${r.reason.replace('_', ' ')}`, priority: r.reportsOnTarget > 1 || r.reason === 'arnaque' ? 'high' : 'normal',
      status: 'a_revoir', createdAt: r.createdAt, targetId: r.id,
    })),
    ...mockAdminPayments({}).filter((p) => p.webhook !== 'received' || p.status === 'failed').map((p): QueueItem => ({
      id: `q-p-${p.id}`, kind: 'payment', ref: `#P-${p.id.replace(/\D/g, '').slice(-4)}`, title: p.label,
      subtitle: p.webhook === 'missing' ? 'Webhook non reçu' : p.status === 'failed' ? 'Paiement échoué' : 'Signature invalide',
      priority: p.webhook === 'invalid_signature' ? 'high' : 'normal', status: 'a_revoir', createdAt: p.createdAt, targetId: p.id,
    })),
    ...mockProofs().map((p): QueueItem => ({
      id: `q-pr-${p.id}`, kind: 'proof', ref: `#PV-${p.id.replace(/\D/g, '').padStart(3, '0')}`, title: p.userName, subtitle: p.label,
      priority: 'normal', status: 'a_verifier', createdAt: p.submittedAt, targetId: p.id,
    })),
  ];
  return items.filter((i) => !kind || i.kind === kind)
    .sort((a, b) => (a.priority === b.priority ? b.createdAt.localeCompare(a.createdAt) : a.priority === 'high' ? -1 : 1));
}
