// mocks/search.mock.ts — Recherche & filtres (démo, remplacé par GET /search…)
import { normalize } from '@/lib/searchFilters';
import type {
  CursorPage, FeedItem, SavedSearch, SavedSearchInput, SearchFilters, SearchOptions, SearchSuggestion,
} from '@/types';
import { FEED_ITEMS } from './feed.mock';

export const SEARCH_OPTIONS: SearchOptions = {
  cities: [
    { name: 'Yaoundé', districts: ['Bastos', 'Biyem-Assi', 'Essos', 'Mvan', 'Odza', 'Omnisport'] },
    { name: 'Douala', districts: ['Akwa', 'Bonamoussadi', 'Bonapriso', 'Lendi', 'Logpom', 'Makepe'] },
  ],
  propertyKinds: [
    { value: 'appartement', label: 'Appartement' },
    { value: 'studio', label: 'Studio' },
    { value: 'chambre', label: 'Chambre' },
    { value: 'maison', label: 'Maison' },
    { value: 'villa', label: 'Villa' },
    { value: 'terrain', label: 'Terrain' },
    { value: 'bureau', label: 'Bureau' },
    { value: 'commerce', label: 'Local commercial' },
  ],
  amenities: [
    { value: 'meuble', label: 'Meublé' },
    { value: 'parking', label: 'Parking' },
    { value: 'eau_24_7', label: 'Eau 24/7' },
    { value: 'jardin', label: 'Jardin' },
    { value: 'groupe_electrogene', label: 'Groupe électrogène' },
  ],
  jobs: [
    { value: 'chauffeur', label: 'Chauffeur' },
    { value: 'menagere', label: 'Ménagère' },
    { value: 'cuisinier', label: 'Cuisinier / cuisinière' },
    { value: 'auxiliaire_de_vie', label: 'Auxiliaire de vie' },
  ],
  serviceCategories: [
    { value: 'demenagement', label: 'Déménagement' },
    { value: 'plomberie', label: 'Plomberie' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'peinture', label: 'Peinture' },
    { value: 'menage', label: 'Ménage' },
    { value: 'gardiennage', label: 'Gardiennage' },
    { value: 'travaux', label: 'Travaux' },
    { value: 'professionnels_habilites', label: 'Professionnels habilités' },
  ],
};

const amenityLabel = (code: string) =>
  normalize(SEARCH_OPTIONS.amenities.find((a) => a.value === code)?.label ?? code);

const AVAILABILITY_RANK = { immediate: 0, sous_15_jours: 1, a_convenir: 2 } as const;

function matches(item: FeedItem, f: SearchFilters): boolean {
  if (item.universe !== f.universe) return false;
  if (f.city && item.city !== f.city) return false;
  if (f.district && item.district !== f.district) return false;
  if (f.verifiedOnly && !item.publisher.verified) return false;

  if (f.q) {
    const q = normalize(f.q);
    const haystack = [item.title, item.city, item.district, item.publisher.name,
      item.universe === 'personnel' ? item.job : '', item.universe === 'services' ? item.categoryLabel : '']
      .filter(Boolean).map((s) => normalize(s as string)).join(' ');
    if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
  }

  switch (item.universe) {
    case 'immobilier': {
      if (f.transaction && item.transaction !== f.transaction) return false;
      if (f.propertyKind && item.propertyKind !== f.propertyKind) return false;
      if (f.budgetMin !== undefined && item.price < f.budgetMin) return false;
      if (f.budgetMax !== undefined && item.price > f.budgetMax) return false;
      if (f.bedroomsMin !== undefined && (item.bedrooms ?? 0) < f.bedroomsMin) return false;
      if (f.surfaceMin !== undefined && (item.surface ?? 0) < f.surfaceMin) return false;
      if (f.availableNow && !item.availableNow) return false;
      if (f.amenities?.length) {
        const have = item.amenities.map(normalize);
        if (!f.amenities.every((code) => have.includes(amenityLabel(code)))) return false;
      }
      return true;
    }
    case 'personnel':
      if (f.job && item.jobCode !== f.job) return false;
      if (f.experienceMin !== undefined && item.experienceYears < f.experienceMin) return false;
      if (f.availability && AVAILABILITY_RANK[item.availability] > AVAILABILITY_RANK[f.availability]) return false;
      if (f.trainedOnly && !item.trained) return false;
      if (f.salaryMax !== undefined && item.salaryMin !== undefined && item.salaryMin > f.salaryMax) return false;
      return true;
    case 'services':
      return !f.category || item.category === f.category;
  }
}

const priceOf = (i: FeedItem) =>
  i.universe === 'immobilier' ? i.price : i.universe === 'services' ? (i.priceFrom ?? 0) : 0;

const PLAN_RANK = { premium: 2, standard: 1, gratuit: 0 } as const;

function runSearch(f: SearchFilters): FeedItem[] {
  const found = FEED_ITEMS.filter((i) => matches(i, f));
  switch (f.sort) {
    // Pertinence seule : aucun effet des plans (le mock garde l'ordre de base comme "pertinence").
    case 'pertinence_pure': return found;
    case 'recent': return [...found].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'prix_asc': return [...found].sort((a, b) => priceOf(a) - priceOf(b));
    case 'prix_desc': return [...found].sort((a, b) => priceOf(b) - priceOf(a));
    default:
      // Personnel : pertinence puis niveau de visibilité (M10). Les profils gratuits restent listés.
      return f.universe === 'personnel'
        ? [...found].sort((a, b) => (a.universe === 'personnel' && b.universe === 'personnel' ? PLAN_RANK[b.plan] - PLAN_RANK[a.plan] : 0))
        : found;
  }
}

export function mockSearch(f: SearchFilters, cursor: string | null, limit: number): CursorPage<FeedItem> {
  const all = runSearch(f);
  const start = cursor ? Number(cursor) : 0;
  const next = start + limit;
  return { items: all.slice(start, next), nextCursor: next < all.length ? String(next) : null, total: all.length };
}

export const mockSearchCount = (f: SearchFilters) => ({ total: runSearch(f).length });

export function mockSuggestions(q: string): SearchSuggestion[] {
  const n = normalize(q);
  if (n.length < 2) return [];
  const out: SearchSuggestion[] = [];
  SEARCH_OPTIONS.cities.forEach((c) => {
    if (normalize(c.name).includes(n)) out.push({ kind: 'city', label: c.name, hint: 'Ville', filters: { city: c.name, district: undefined } });
    c.districts.forEach((d) => {
      if (normalize(d).includes(n)) out.push({ kind: 'district', label: d, hint: `Quartier · ${c.name}`, filters: { city: c.name, district: d } });
    });
  });
  SEARCH_OPTIONS.jobs.forEach((j) => {
    if (normalize(j.label).includes(n)) out.push({ kind: 'job', label: j.label, hint: 'Métier', filters: { universe: 'personnel', job: j.value } });
  });
  SEARCH_OPTIONS.serviceCategories.forEach((c) => {
    if (normalize(c.label).includes(n)) out.push({ kind: 'category', label: c.label, hint: 'Service', filters: { universe: 'services', category: c.value } });
  });
  return out.slice(0, 8);
}

// ── Recherches sauvegardées (mémoire de session) ──
let saved: SavedSearch[] = [
  {
    id: 'ss-1',
    name: 'Studio Yaoundé ≤ 80 000 F',
    filters: { universe: 'immobilier', city: 'Yaoundé', propertyKind: 'studio', budgetMax: 80000 },
    alertEnabled: true,
    newResults: 2,
    createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  },
];

export const mockListSaved = () => [...saved];

export function mockCreateSaved(input: SavedSearchInput): SavedSearch {
  const created: SavedSearch = { ...input, id: `ss-${Date.now()}`, newResults: 0, createdAt: new Date().toISOString() };
  saved = [created, ...saved];
  return created;
}

export function mockUpdateSaved(id: string, patch: Partial<SavedSearchInput>): SavedSearch {
  saved = saved.map((s) => (s.id === id ? { ...s, ...patch } : s));
  const found = saved.find((s) => s.id === id);
  if (!found) throw new Error('Recherche introuvable');
  return found;
}

export function mockDeleteSaved(id: string) {
  saved = saved.filter((s) => s.id !== id);
}
