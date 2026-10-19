// mocks/settings.mock.ts — Paramètres administrables partagés par les mocks (démo, persistés)
// Le back-office (admin.mock) les modifie ; plans, déblocage contact et catégories les lisent.
import { persisted } from './storage';

export interface PlanOverride {
  price?: number;
  active?: boolean;
  recommended?: boolean;
  features?: string[];
}

export interface MockSettings {
  contactUnlock: { min: number; max: number; price: number };
  plans: Record<string, PlanOverride>;
  ranking: { organicQuotaPercent: number; maxPlanBoostPercent: number };
  categoriesActive: Record<string, boolean>;
}

export const settingsStore = persisted<MockSettings>('ludra.mock.settings', () => ({
  contactUnlock: { min: 250, max: 500, price: 500 },
  plans: {},
  ranking: { organicQuotaPercent: 60, maxPlanBoostPercent: 20 },
  categoriesActive: {},
}));
