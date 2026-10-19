// mocks/subscription.mock.ts — Plans et abonnements (démo)
import { ApiError } from '@/lib/api';
import type { Payment, Plan, PlanAudience, SubscribeInput, Subscription } from '@/types';
import { mockCreatePayment } from './payment.mock';
import { persisted } from './storage';
import { settingsStore } from './settings.mock';

const DAY = 86_400_000;

export const PLANS: Plan[] = [
  {
    code: 'oa_verifie', audience: 'owner_agent', name: 'Vérifié', price: 5000, period: 'month', durationDays: 30, recommended: false, tone: 'trust', rank: 1,
    features: ['Badge identité vérifiée', 'Profil public rassurant', 'Messagerie & avis'],
  },
  {
    code: 'oa_pro', audience: 'owner_agent', name: 'Pro', price: 10000, period: 'month', durationDays: 30, recommended: true, tone: 'brand', rank: 2,
    features: ['Tout Vérifié', 'Mise en avant périodique', 'Statistiques avancées', 'Priorité dans les résultats'],
  },
  {
    code: 'oa_premium', audience: 'owner_agent', name: 'Premium', price: 15000, period: 'month', durationDays: 30, recommended: false, tone: 'perso', rank: 3,
    features: ['Tout Pro', 'Plus de boosts sponsorisés', 'Support prioritaire', 'Rapport performance + reporting'],
  },
  // ── Candidats (M12) : le profil reste gratuit ; les plans changent le classement, pas les compétences ──
  {
    code: 'cand_gratuit', audience: 'candidate', name: 'Gratuit', price: 0, period: 'pass', durationDays: 0, recommended: false, tone: 'trust', rank: 0,
    features: ['Profil créé gratuitement', 'Visibilité organique', 'Messagerie interne'],
  },
  {
    code: 'cand_standard', audience: 'candidate', name: 'Standard', price: 500, period: 'pass', durationDays: 30, recommended: false, tone: 'brand', rank: 1,
    features: ['Priorité modérée', 'Ciblage postes ~50–80k', 'Badge Standard'],
  },
  {
    code: 'cand_premium', audience: 'candidate', name: 'Premium', price: 1000, period: 'pass', durationDays: 30, recommended: true, tone: 'perso', rank: 2,
    features: ['Priorité la plus forte', 'Ciblage postes ~100–200k+', 'Badge Premium + stats'],
  },
  // ── Recruteurs (M13) ──
  {
    code: 'rec_essentiel', audience: 'recruiter', name: 'Essentiel', price: 5000, period: 'pass', durationDays: 30, recommended: false, tone: 'brand', rank: 1,
    features: ['Accès aux meilleurs profils', 'Filtres avancés', 'Shortlist de candidats'],
  },
  {
    code: 'rec_forme', audience: 'recruiter', name: 'Formé', price: 8000, period: 'pass', durationDays: 30, recommended: true, tone: 'trust', rank: 2,
    features: ['Tout Essentiel', 'Priorité aux profils formés', 'Badges de formation vérifiée', 'Export shortlist'],
  },
  {
    code: 'rec_premium', audience: 'recruiter', name: 'Premium', price: 10000, period: 'pass', durationDays: 30, recommended: false, tone: 'perso', rank: 3,
    features: ['Tout Formé', 'Présélection assistée', 'Profils premium en tête', 'Support prioritaire'],
  },
];

const store = persisted<Subscription[]>('ludra.mock.subscriptions', () => []);

const isActive = (s: Subscription) => s.status === 'active' && new Date(s.expiresAt).getTime() > Date.now();

/** Plan avec les surcharges du back-office (prix, avantages, recommandé). */
export const effectivePlan = (p: Plan): Plan & { active: boolean } => {
  const o = settingsStore.get().plans[p.code] ?? {};
  return { ...p, price: o.price ?? p.price, recommended: o.recommended ?? p.recommended, features: o.features ?? p.features, active: o.active ?? true };
};

export const mockPlans = (audience: PlanAudience) =>
  PLANS.filter((p) => p.audience === audience).map(effectivePlan).filter((p) => p.active).map(({ active: _a, ...p }) => p);

export const mockMySubscriptions = () => store.get().filter(isActive);

export const mockHasActive = (audience: PlanAudience) => store.get().some((s) => s.audience === audience && isActive(s));

/** Abonnement actif d'une audience, ou null. */
export const mockActive = (audience: PlanAudience) => store.get().find((s) => s.audience === audience && isActive(s)) ?? null;

/** Effets métier à l'activation (ex. plan candidat → niveau de visibilité du profil). */
const activationHooks: ((planCode: string) => void)[] = [];
export const onPlanActivated = (fn: (planCode: string) => void) => { activationHooks.push(fn); };

export function mockSubscribe(input: SubscribeInput): Payment {
  const base = PLANS.find((p) => p.code === input.planCode);
  const plan = base && effectivePlan(base);
  if (!plan || !plan.active) throw new ApiError('Plan introuvable', 404, 'NOT_FOUND');
  if (plan.price === 0) throw new ApiError('Le plan gratuit ne nécessite pas de paiement.', 422, 'FREE_PLAN');
  return mockCreatePayment({
    ...input,
    purpose: 'subscription',
    amount: plan.price,
    planCode: plan.code,
    label: `${plan.period === 'month' ? 'Abonnement' : 'Plan'} ${plan.name} — ${plan.audience === 'owner_agent' ? 'Propriétaire / Agent' : plan.audience === 'candidate' ? 'Candidat' : 'Recruteur'}`,
    plan: { code: plan.code, name: plan.name },
    onPaid: () => {
      const now = Date.now();
      // Un seul abonnement actif par audience : le nouveau remplace l'ancien.
      activationHooks.forEach((fn) => fn(plan.code));
      const others = store.get().filter((s) => s.audience !== plan.audience);
      store.set([...others, {
        id: `sub-${now}`, planCode: plan.code, planName: plan.name, audience: plan.audience, status: 'active',
        startedAt: new Date(now).toISOString(), expiresAt: new Date(now + plan.durationDays * DAY).toISOString(),
      }]);
    },
  });
}
