import { formatAmount } from '@/utilis/format';
import type { SearchFilters, SearchOptions } from '@/types';

const UNIVERSE_LABEL = { immobilier: 'Immobilier', personnel: 'Personnel', services: 'Services' } as const;

const labelOf = (list: { value: string; label: string }[] | undefined, v?: string) =>
  v ? list?.find((o) => o.value === v)?.label ?? v : undefined;

/** Nom lisible d'une recherche, ex. "Studio · Yaoundé, Bastos · ≤ 80 000 FCFA". */
export function describeFilters(f: SearchFilters, options: SearchOptions | null): string {
  const what =
    labelOf(options?.propertyKinds, f.propertyKind) ??
    labelOf(options?.jobs, f.job) ??
    labelOf(options?.serviceCategories, f.category) ??
    (f.q ? `« ${f.q} »` : UNIVERSE_LABEL[f.universe]);

  const where = [f.city, f.district].filter(Boolean).join(', ');

  let budget: string | undefined;
  if (f.budgetMin !== undefined && f.budgetMax !== undefined) budget = `${formatAmount(f.budgetMin)} – ${formatAmount(f.budgetMax)}`;
  else if (f.budgetMax !== undefined) budget = `≤ ${formatAmount(f.budgetMax)}`;
  else if (f.budgetMin !== undefined) budget = `≥ ${formatAmount(f.budgetMin)}`;

  return [what, where, budget].filter(Boolean).join(' · ');
}
