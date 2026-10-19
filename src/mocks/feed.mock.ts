// mocks/feed.mock.ts — Données de démo du feed (supprimées quand l'API est branchée)
import type { FeedItem, FeedPage, FeedQuery, MeCounters, Publisher } from '@/types';
import { persisted } from './storage';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const img = (id: string) => ({
  url: `https://images.unsplash.com/${id}?w=900&h=560&fit=crop`,
  type: 'image' as const,
});

const publishers: Record<string, Publisher> = {
  nadia: { id: 'u-nadia', name: 'Nadia L.', kind: 'owner', verified: true, rating: 4.7, reviewsCount: 26, city: 'Yaoundé' },
  mboa: { id: 'u-mboa', name: 'Mboa Nest', kind: 'agent', verified: true, rating: 4.5, reviewsCount: 41, city: 'Yaoundé' },
  homeMarket: { id: 'u-hm', name: 'Home Market', kind: 'agent', verified: true, rating: 4.2, reviewsCount: 18, city: 'Douala' },
  jean: { id: 'u-jean', name: 'Jean Sarl', kind: 'provider', verified: true, rating: 4.8, reviewsCount: 12, city: 'Yaoundé' },
  clarisse: { id: 'u-clarisse', name: 'Clarisse N.', kind: 'candidate', verified: true, rating: 4.6, reviewsCount: 10, city: 'Yaoundé' },
  jeanPaul: { id: 'u-jp', name: 'Jean-Paul M.', kind: 'candidate', verified: false, rating: 4.1, reviewsCount: 4, city: 'Douala' },
  paul: { id: 'u-paul', name: 'Paul T.', kind: 'owner', verified: false, city: 'Douala' },
  elec: { id: 'u-elec', name: 'ÉlecPro Douala', kind: 'provider', verified: true, rating: 4.4, reviewsCount: 33, city: 'Douala' },
};

/** Utilisateur connecté en mode démo (publications faites via « + Publier »). */
export const MOCK_ME: Publisher = { id: 'u-me', name: 'Vous', kind: 'user', verified: false, city: 'Yaoundé' };

/** Jeu de données partagé par les mocks feed et recherche. */
export const FEED_ITEMS: FeedItem[] = [
  {
    id: 'l-001', universe: 'immobilier', publisher: publishers.nadia,
    title: 'Appartement moderne à Bastos', city: 'Yaoundé', district: 'Bastos',
    media: [img('photo-1568605114967-8130f3a36994')], createdAt: minutesAgo(25),
    isFavorite: false, sponsored: false,
    transaction: 'location', propertyKind: 'appartement', price: 85000, priceUnit: 'mois',
    bedrooms: 2, bathrooms: 2, surface: 110, amenities: ['parking'], availableNow: true,
  },
  {
    id: 'c-001', universe: 'personnel', publisher: publishers.clarisse,
    title: 'Chauffeure expérimentée — permis B', city: 'Yaoundé',
    media: [], createdAt: minutesAgo(48), isFavorite: false, sponsored: false,
    job: 'Chauffeure', jobCode: 'chauffeur', experienceYears: 6, availability: 'immediate', plan: 'premium', trained: true, salaryMin: 100000, salaryMax: 200000,
  },
  {
    id: 'l-002', universe: 'immobilier', publisher: publishers.mboa,
    title: 'Studio meublé à Omnisport', city: 'Yaoundé', district: 'Omnisport',
    media: [img('photo-1502672260266-1c1ef2d93688')], createdAt: minutesAgo(90),
    isFavorite: true, sponsored: true,
    transaction: 'location', propertyKind: 'studio', price: 60000, priceUnit: 'mois',
    bedrooms: 1, bathrooms: 1, surface: 35, amenities: ['meublé', 'eau 24/7'], availableNow: true,
  },
  {
    id: 's-001', universe: 'services', publisher: publishers.jean,
    title: 'Déménagement Yaoundé & environs', city: 'Yaoundé',
    media: [img('photo-1600518464441-9154a4dea21b')], createdAt: minutesAgo(130),
    isFavorite: false, sponsored: false,
    category: 'demenagement', categoryLabel: 'Déménagement',
    summary: 'Manutention, emballage et transport. Devis gratuit sous 24 h.', priceFrom: 25000, regulated: false,
  },
  {
    id: 'l-003', universe: 'immobilier', publisher: publishers.paul,
    title: 'Terrain titré 500 m² à Lendi', city: 'Douala', district: 'Lendi',
    media: [img('photo-1500382017468-9049fed747ef')], createdAt: minutesAgo(200),
    isFavorite: false, sponsored: false,
    transaction: 'vente', propertyKind: 'terrain', price: 12500000, priceUnit: 'total',
    surface: 500, amenities: ['titre foncier annoncé'], availableNow: true,
  },
  {
    id: 'c-002', universe: 'personnel', publisher: publishers.jeanPaul,
    title: 'Chauffeur poids léger, disponible', city: 'Douala',
    media: [], createdAt: minutesAgo(260), isFavorite: false, sponsored: false,
    job: 'Chauffeur', jobCode: 'chauffeur', experienceYears: 4, availability: 'sous_15_jours', plan: 'standard', trained: false, salaryMin: 70000, salaryMax: 90000,
  },
  {
    id: 'l-004', universe: 'immobilier', publisher: publishers.homeMarket,
    title: 'Villa 4 chambres avec jardin à Bonapriso', city: 'Douala', district: 'Bonapriso',
    media: [img('photo-1600596542815-ffad4c1539a9')], createdAt: minutesAgo(380),
    isFavorite: false, sponsored: false,
    transaction: 'location', propertyKind: 'villa', price: 450000, priceUnit: 'mois',
    bedrooms: 4, bathrooms: 3, surface: 320, amenities: ['parking', 'jardin', 'groupe électrogène'], availableNow: false,
  },
  {
    id: 's-002', universe: 'services', publisher: publishers.elec,
    title: 'Électricité bâtiment — installation & dépannage', city: 'Douala',
    media: [], createdAt: minutesAgo(520), isFavorite: false, sponsored: false,
    category: 'electricite', categoryLabel: 'Électricité',
    summary: 'Mise aux normes, tableaux, dépannage rapide 7j/7.', priceFrom: 10000, regulated: false,
  },
  {
    id: 'l-005', universe: 'immobilier', publisher: publishers.mboa,
    title: 'Appartement 3 pièces à Biyem-Assi', city: 'Yaoundé', district: 'Biyem-Assi',
    media: [img('photo-1522708323590-d24dbb6b0267')], createdAt: minutesAgo(640),
    isFavorite: false, sponsored: false,
    transaction: 'location', propertyKind: 'appartement', price: 120000, priceUnit: 'mois',
    bedrooms: 2, bathrooms: 1, surface: 80, amenities: ['parking', 'eau 24/7'], availableNow: true,
  },
  {
    id: 'c-003', universe: 'personnel', publisher: { id: 'u-amina', name: 'Amina K.', kind: 'candidate', verified: true, rating: 4.3, reviewsCount: 6, city: 'Yaoundé' },
    title: 'Ménagère sérieuse, références contrôlées', city: 'Yaoundé',
    media: [], createdAt: minutesAgo(700), isFavorite: false, sponsored: false,
    job: 'Ménagère', jobCode: 'menagere', experienceYears: 2, availability: 'immediate', plan: 'gratuit', trained: false, salaryMin: 40000, salaryMax: 60000,
  },
  {
    id: 'c-004', universe: 'personnel', publisher: { id: 'u-esther', name: 'Esther B.', kind: 'candidate', verified: true, rating: 4.9, reviewsCount: 7, city: 'Douala' },
    title: 'Cuisinière — cuisine camerounaise et européenne', city: 'Douala', district: 'Bonapriso',
    media: [], createdAt: minutesAgo(820), isFavorite: false, sponsored: false,
    job: 'Cuisinière', jobCode: 'cuisinier', experienceYears: 9, availability: 'a_convenir', plan: 'standard', trained: true, salaryMin: 90000, salaryMax: 130000,
  },
  {
    id: 'c-005', universe: 'personnel', publisher: { id: 'u-marc', name: 'Marc A.', kind: 'candidate', verified: false, city: 'Yaoundé' },
    title: 'Auxiliaire de vie, accompagnement personnes âgées', city: 'Yaoundé', district: 'Mvan',
    media: [], createdAt: minutesAgo(1100), isFavorite: false, sponsored: false,
    job: 'Auxiliaire de vie', jobCode: 'auxiliaire_de_vie', experienceYears: 3, availability: 'immediate', plan: 'gratuit', trained: true, salaryMin: 60000, salaryMax: 80000,
  },
  {
    id: 's-003', universe: 'services', publisher: { id: 'u-plomb', name: 'Plomberie Express', kind: 'provider', verified: false, city: 'Yaoundé' },
    title: 'Plombier — fuites, installations sanitaires', city: 'Yaoundé', district: 'Essos',
    media: [], createdAt: minutesAgo(900), isFavorite: false, sponsored: false,
    category: 'plomberie', categoryLabel: 'Plomberie',
    summary: 'Intervention rapide, devis sur place.', priceFrom: 8000, regulated: false,
  },
  {
    id: 's-004', universe: 'services', publisher: { id: 'u-peint', name: 'Déco Peinture', kind: 'provider', verified: true, rating: 4.6, reviewsCount: 15, city: 'Yaoundé' },
    title: 'Peinture intérieure et extérieure, finitions soignées', city: 'Yaoundé', district: 'Odza',
    media: [], createdAt: minutesAgo(1300), isFavorite: false, sponsored: false,
    category: 'peinture', categoryLabel: 'Peinture', summary: 'Rénovation, enduits, peinture décorative. Devis gratuit.', priceFrom: 15000, regulated: false,
  },
  {
    id: 's-005', universe: 'services', publisher: { id: 'u-clean', name: 'Clean Maison', kind: 'provider', verified: false, city: 'Douala' },
    title: 'Ménage et grand nettoyage de logement', city: 'Douala', district: 'Akwa',
    media: [], createdAt: minutesAgo(1500), isFavorite: false, sponsored: false,
    category: 'menage', categoryLabel: 'Ménage', summary: 'Entretien régulier, nettoyage fin de chantier ou avant emménagement.', priceFrom: 10000, regulated: false,
  },
  {
    id: 's-006', universe: 'services', publisher: { id: 'u-garde', name: 'Garde Sûre', kind: 'provider', verified: true, rating: 4.3, reviewsCount: 9, city: 'Yaoundé' },
    title: 'Gardiennage résidentiel 24h/24', city: 'Yaoundé', district: 'Bastos',
    media: [], createdAt: minutesAgo(1700), isFavorite: false, sponsored: false,
    category: 'gardiennage', categoryLabel: 'Gardiennage', summary: 'Agents formés, rondes et surveillance de chantier.', priceFrom: 80000, regulated: false,
  },
  {
    id: 's-007', universe: 'services', publisher: { id: 'u-btp', name: 'Bâtir Plus', kind: 'provider', verified: true, rating: 4.4, reviewsCount: 21, city: 'Douala' },
    title: 'Maçonnerie, rénovation et petits travaux', city: 'Douala', district: 'Makepe',
    media: [], createdAt: minutesAgo(2000), isFavorite: false, sponsored: false,
    category: 'travaux', categoryLabel: 'Travaux', summary: 'Maçonnerie, carrelage, réparation de toiture.', priceFrom: 20000, regulated: false,
  },
  {
    id: 's-008', universe: 'services', publisher: { id: 'u-notaire', name: 'Me Ngo Bassa', kind: 'provider', verified: true, rating: 4.9, reviewsCount: 11, city: 'Yaoundé' },
    title: 'Office notarial — vérification de titres fonciers', city: 'Yaoundé', district: 'Bastos',
    media: [], createdAt: minutesAgo(2400), isFavorite: false, sponsored: false,
    category: 'professionnels_habilites', categoryLabel: 'Professionnels habilités', summary: 'Authentification d’actes, vérification de titre foncier avant achat.', regulated: true,
  },
  {
    id: 's-009', universe: 'services', publisher: { id: 'u-geo', name: 'Cabinet GéoMesure', kind: 'provider', verified: true, rating: 4.7, reviewsCount: 6, city: 'Douala' },
    title: 'Géomètre expert — bornage et levés topographiques', city: 'Douala', district: 'Bonamoussadi',
    media: [], createdAt: minutesAgo(2600), isFavorite: false, sponsored: false,
    category: 'professionnels_habilites', categoryLabel: 'Professionnels habilités', summary: 'Bornage de terrain, plans de situation, levés.', regulated: true,
  },
  // Publications de l'utilisateur de démo (Mon compte › Mes annonces)
  {
    id: 'l-me-1', universe: 'immobilier', publisher: MOCK_ME,
    title: 'Chambre meublée à Essos, proche université', city: 'Yaoundé', district: 'Essos',
    media: [img('photo-1505693416388-ac5ce068fe85')], createdAt: minutesAgo(4000), isFavorite: false, sponsored: false,
    transaction: 'location', propertyKind: 'chambre', price: 35000, priceUnit: 'mois',
    bedrooms: 1, bathrooms: 1, surface: 18, amenities: ['meublé', 'eau 24/7'], availableNow: true,
  },
  {
    id: 'l-me-2', universe: 'immobilier', publisher: MOCK_ME,
    title: 'Studio rénové à Mvan', city: 'Yaoundé', district: 'Mvan',
    media: [img('photo-1493809842364-78817add7ffb')], createdAt: minutesAgo(30000), isFavorite: false, sponsored: false,
    transaction: 'location', propertyKind: 'studio', price: 55000, priceUnit: 'mois',
    bedrooms: 1, bathrooms: 1, surface: 30, amenities: ['parking'], availableNow: false,
  },
];

// Publications ajoutées en cours de démo (« + Publier », approbation admin) : persistées.
const addedItems = persisted<FeedItem[]>('ludra.mock.addedItems', () => []);
addedItems.get().forEach((it) => { if (!FEED_ITEMS.some((x) => x.id === it.id)) FEED_ITEMS.unshift(it); });

/** Ajoute (ou remplace) une publication dans le jeu de démo, de façon persistante. */
export function addFeedItem(item: FeedItem) {
  const idx = FEED_ITEMS.findIndex((x) => x.id === item.id);
  if (idx >= 0) FEED_ITEMS[idx] = item; else FEED_ITEMS.unshift(item);
  addedItems.set([item, ...addedItems.get().filter((x) => x.id !== item.id)]);
}

export function mockFeed({ universe, cursor, limit = 5 }: FeedQuery): FeedPage {
  const filtered = universe ? FEED_ITEMS.filter((i) => i.universe === universe) : FEED_ITEMS;
  const start = cursor ? Number(cursor) : 0;
  const items = filtered.slice(start, start + limit);
  const next = start + limit;
  return {
    items,
    nextCursor: next < filtered.length ? String(next) : null,
    total: filtered.length,
  };
}

export function mockSuggestedAccounts(): Publisher[] {
  return [publishers.mboa, publishers.jean, publishers.homeMarket];
}

export function mockCounters(): MeCounters {
  return { unreadMessages: 3, unreadNotifications: 2 };
}
