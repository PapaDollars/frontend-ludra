// types/subscription.ts — Abonnements (M08 propriétaire/agent ; M12 candidats ; M13 recruteurs)
import type { Amount, ISODate } from './common';

export type PlanAudience = 'owner_agent' | 'candidate' | 'recruiter';

/** Plan administrable (prix, avantages, mise en avant) — rien n'est codé en dur côté front. */
export interface Plan {
  code: string;
  audience: PlanAudience;
  name: string;
  price: Amount;
  /** `month` : abonnement mensuel (« / mois ») ; `pass` : forfait de `durationDays` jours. */
  period: 'month' | 'pass';
  durationDays: number;
  /** Avantages affichés, dans l'ordre. */
  features: string[];
  /** Badge "Conseillé". */
  recommended: boolean;
  /** Couleur d'accent de la carte. */
  tone: 'trust' | 'brand' | 'perso' | 'neutral';
  /** Rang croissant (0 = gratuit). */
  rank: number;
}

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface Subscription {
  id: string;
  planCode: string;
  planName: string;
  audience: PlanAudience;
  status: SubscriptionStatus;
  startedAt: ISODate;
  expiresAt: ISODate;
}
