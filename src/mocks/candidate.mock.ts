// mocks/candidate.mock.ts — Profils candidats, accès recruteur, shortlist (démo)
//
// Les droits recruteur découlent du forfait actif (subscription.mock, audience "recruiter").
// Souscrire un plan candidat change le niveau de visibilité du profil de démo (classement).
import { ApiError } from '@/lib/api';
import type {
  CandidateDetail, CandidateFeedItem, RecruiterAccess, RecruiterRights, ShortlistEntry,
} from '@/types';
import { FEED_ITEMS, MOCK_ME } from './feed.mock';
import { mockActive, onPlanActivated } from './subscription.mock';
import { persisted } from './storage';

const EXTRA: Record<string, Partial<CandidateDetail>> = {
  'c-001': {
    summary: 'Chauffeure expérimentée, bonne connaissance de Yaoundé, disponible pour entreprise ou famille. Profil complet et documents contrôlés.',
    skills: ['Conduite urbaine', 'Ponctuelle', 'Disponible'], training: 'Conduite défensive', license: 'B - valide', references: { total: 2, verified: 2 },
  },
  'c-002': { summary: 'Chauffeur poids léger, trajets urbains et interurbains, entretien courant du véhicule.', skills: ['Interurbain', 'Entretien véhicule'], license: 'B - valide', references: { total: 1, verified: 0 } },
  'c-003': { summary: 'Ménagère sérieuse et discrète, entretien de maison et repassage, références contrôlées.', skills: ['Repassage', 'Entretien', 'Discrétion'], references: { total: 2, verified: 1 } },
  'c-004': { summary: 'Cuisinière, neuf ans en famille et en restaurant. Cuisine camerounaise et européenne, gestion des courses.', skills: ['Cuisine camerounaise', 'Pâtisserie', 'Gestion des courses'], training: 'CAP cuisine', references: { total: 3, verified: 3 } },
  'c-005': { summary: 'Auxiliaire de vie, accompagnement de personnes âgées, aide aux repas et à la mobilité.', skills: ['Aide à la mobilité', 'Patience', 'Premiers secours'], training: 'Formation premiers secours', references: { total: 1, verified: 1 } },
};

const RIGHTS: Record<string, RecruiterRights> = {
  none: { contact: false, advancedFilters: false, shortlist: false, trainedPriority: false, exportShortlist: false, assistedPreselection: false, prioritySupport: false },
  rec_essentiel: { contact: true, advancedFilters: true, shortlist: true, trainedPriority: false, exportShortlist: false, assistedPreselection: false, prioritySupport: false },
  rec_forme: { contact: true, advancedFilters: true, shortlist: true, trainedPriority: true, exportShortlist: true, assistedPreselection: false, prioritySupport: false },
  rec_premium: { contact: true, advancedFilters: true, shortlist: true, trainedPriority: true, exportShortlist: true, assistedPreselection: true, prioritySupport: true },
};

const shortlist = persisted<ShortlistEntry[]>('ludra.mock.shortlist', () => []);

const candidates = () => FEED_ITEMS.filter((i): i is CandidateFeedItem => i.universe === 'personnel');

// Plan candidat → visibilité du profil de démo
onPlanActivated((code) => {
  const plan = code === 'cand_premium' ? 'premium' : code === 'cand_standard' ? 'standard' : null;
  if (plan) candidates().filter((c) => c.publisher.id === MOCK_ME.id).forEach((c) => { c.plan = plan; });
});

export function mockRecruiterAccess(): RecruiterAccess {
  const sub = mockActive('recruiter');
  return {
    planCode: sub?.planCode ?? null,
    planName: sub?.planName ?? null,
    expiresAt: sub?.expiresAt ?? null,
    rights: RIGHTS[sub?.planCode ?? 'none'] ?? RIGHTS.none,
    shortlistCount: sub ? shortlist.get().length : 0,
  };
}

export function mockCandidateDetail(id: string, authenticated: boolean): CandidateDetail {
  const c = candidates().find((x) => x.id === id);
  if (!c) throw new ApiError('Profil introuvable', 404, 'NOT_FOUND');
  const access = mockRecruiterAccess();
  const isOwner = c.publisher.id === MOCK_ME.id;
  return {
    summary: c.title, skills: [], references: { total: 0, verified: 0 },
    ...c,
    ...EXTRA[id],
    badges: { identityVerified: c.publisher.verified, trained: c.trained },
    viewerAccess: {
      canContact: access.rights.contact,
      canShortlist: access.rights.shortlist,
      shortlisted: shortlist.get().some((e) => e.candidate.id === id),
      ...(!authenticated ? { reason: 'login' as const } : !access.planCode ? { reason: 'no_plan' as const } : {}),
    },
    viewerIsOwner: isOwner,
  };
}

/** Profil candidat de l'utilisateur connecté (null s'il n'en a pas publié). */
export function mockMyCandidateProfile(): CandidateFeedItem | null {
  return candidates().find((c) => c.publisher.id === MOCK_ME.id) ?? null;
}

function requireRight(right: keyof RecruiterRights) {
  if (!mockRecruiterAccess().rights[right]) throw new ApiError('Fonction réservée aux forfaits recruteurs.', 403, 'PLAN_REQUIRED');
}

export function mockShortlist(): ShortlistEntry[] {
  requireRight('shortlist');
  return shortlist.get();
}

export function mockAddToShortlist(candidateId: string): ShortlistEntry[] {
  requireRight('shortlist');
  const c = candidates().find((x) => x.id === candidateId);
  if (!c) throw new ApiError('Profil introuvable', 404, 'NOT_FOUND');
  if (!shortlist.get().some((e) => e.candidate.id === candidateId)) {
    shortlist.set([{ candidate: c, addedAt: new Date().toISOString() }, ...shortlist.get()]);
  }
  return shortlist.get();
}

export function mockRemoveFromShortlist(candidateId: string): ShortlistEntry[] {
  requireRight('shortlist');
  shortlist.set(shortlist.get().filter((e) => e.candidate.id !== candidateId));
  return shortlist.get();
}

export function mockExportShortlist(): Blob {
  requireRight('exportShortlist');
  const rows = [['Nom', 'Métier', 'Ville', 'Expérience (ans)', 'Disponibilité', 'Formé', 'Profil']];
  shortlist.get().forEach(({ candidate: c }) => rows.push([
    c.publisher.name, c.job, c.city, String(c.experienceYears), c.availability, c.trained ? 'oui' : 'non',
    `${window.location.origin}/personnel/candidats/${c.id}`,
  ]));
  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(';')).join('\n');
  return new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
}
