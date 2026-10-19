// lib/searchFilters.ts — Sérialisation SearchFilters ⇄ query string.
// Même format pour l'URL de la page /recherche et pour l'appel GET /search.
import type { SearchFilters, SearchSort, Universe } from '@/types';

export const DEFAULT_SORT: SearchSort = 'pertinence';

export const emptyFilters = (universe: Universe = 'immobilier'): SearchFilters => ({ universe });

const COMMON_KEYS = ['q', 'city', 'district', 'verifiedOnly', 'sort'] as const;

/** Champs propres à chaque univers (les autres sont ignorés). */
const UNIVERSE_KEYS: Record<Universe, readonly (keyof SearchFilters)[]> = {
  immobilier: ['transaction', 'propertyKind', 'budgetMin', 'budgetMax', 'bedroomsMin', 'surfaceMin', 'amenities', 'availableNow'],
  personnel: ['job', 'experienceMin', 'availability', 'trainedOnly', 'salaryMax'],
  services: ['category'],
};

const NUMBER_KEYS = new Set<keyof SearchFilters>(['budgetMin', 'budgetMax', 'bedroomsMin', 'surfaceMin', 'experienceMin', 'salaryMax']);
const BOOLEAN_KEYS = new Set<keyof SearchFilters>(['verifiedOnly', 'availableNow', 'trainedOnly']);
const UNIVERSES: Universe[] = ['immobilier', 'personnel', 'services'];

const isEmpty = (v: unknown) =>
  v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0);

/** Retire les champs vides et ceux qui n'appartiennent pas à l'univers courant. */
export function cleanFilters(f: SearchFilters): SearchFilters {
  const allowed = new Set<keyof SearchFilters>([...COMMON_KEYS, ...UNIVERSE_KEYS[f.universe]]);
  const out: SearchFilters = { universe: f.universe };
  (Object.keys(f) as (keyof SearchFilters)[]).forEach((k) => {
    if (k === 'universe' || !allowed.has(k) || isEmpty(f[k])) return;
    if (k === 'sort' && f.sort === DEFAULT_SORT) return;
    (out as unknown as Record<string, unknown>)[k] = f[k];
  });
  return out;
}

export function filtersToQuery(f: SearchFilters): string {
  const params = new URLSearchParams();
  Object.entries(cleanFilters(f)).forEach(([k, v]) => {
    params.set(k, Array.isArray(v) ? v.join(',') : String(v));
  });
  return params.toString();
}

export function filtersFromQuery(params: URLSearchParams): SearchFilters {
  const u = params.get('universe') as Universe | null;
  const raw: Record<string, unknown> = { universe: u && UNIVERSES.includes(u) ? u : 'immobilier' };
  params.forEach((value, key) => {
    const k = key as keyof SearchFilters;
    if (k === 'universe' || !value) return;
    if (NUMBER_KEYS.has(k)) {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) raw[k] = n;
    } else if (BOOLEAN_KEYS.has(k)) {
      raw[k] = value === 'true';
    } else if (k === 'amenities') {
      raw[k] = value.split(',').filter(Boolean);
    } else {
      raw[k] = value;
    }
  });
  return cleanFilters(raw as unknown as SearchFilters);
}

/** Nombre de filtres actifs dans le panneau (hors univers, texte et tri). */
export function activeFilterCount(f: SearchFilters): number {
  const { universe: _u, q: _q, sort: _s, ...rest } = cleanFilters(f);
  return Object.values(rest).reduce<number>((n, v) => n + (Array.isArray(v) ? v.length : 1), 0);
}

/** Retire les filtres du panneau en gardant univers, texte et tri. */
export const resetPanel = (f: SearchFilters): SearchFilters => ({ universe: f.universe, q: f.q, sort: f.sort });

/** Normalise pour comparer sans casse ni accents. */
export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
