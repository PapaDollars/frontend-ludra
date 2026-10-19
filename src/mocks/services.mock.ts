// mocks/services.mock.ts — Catalogue « Autres services » et profils prestataires (démo)
import { ApiError } from '@/lib/api';
import type { ServiceCategory, ServiceFeedItem, ServiceProviderDetail } from '@/types';
import { FEED_ITEMS, MOCK_ME } from './feed.mock';
import { settingsStore } from './settings.mock';

const CATEGORIES: Omit<ServiceCategory, 'providerCount'>[] = [
  { code: 'demenagement', label: 'Déménagement', description: 'Manutention & transport', initials: 'DM', tone: 'brand', regulated: false },
  { code: 'plomberie', label: 'Plomberie', description: 'Dépannage & installation', initials: 'PL', tone: 'service', regulated: false },
  { code: 'electricite', label: 'Électricité', description: 'Installation & réparation', initials: 'EL', tone: 'caution', regulated: false },
  { code: 'peinture', label: 'Peinture', description: 'Rénovation & finition', initials: 'PE', tone: 'perso', regulated: false },
  { code: 'menage', label: 'Ménage', description: 'Entretien logement', initials: 'ME', tone: 'trust', regulated: false },
  { code: 'gardiennage', label: 'Gardiennage', description: 'Sécurité & surveillance', initials: 'GA', tone: 'navy', regulated: false },
  { code: 'travaux', label: 'Travaux', description: 'Maçonnerie & réparation', initials: 'TR', tone: 'danger', regulated: false },
  { code: 'professionnels_habilites', label: 'Professionnels habilités', description: 'Notaires, géomètres…', initials: 'PR', tone: 'brand', regulated: true },
];

const EXTRA: Record<string, Partial<ServiceProviderDetail>> = {
  's-001': { description: 'Équipe de 6 déménageurs, camion 20 m³. Emballage, démontage/remontage des meubles, transport sécurisé.', structure: 'entreprise', zones: ['Yaoundé', 'Mbalmayo', 'Obala'] },
  's-008': { description: 'Office notarial. Vérification de titres fonciers, actes de vente, successions. Rendez-vous sur demande via la messagerie.', structure: 'entreprise', regulatedProfession: 'Notaire', zones: ['Yaoundé'] },
  's-009': { description: 'Géomètre expert agréé. Bornage contradictoire, plans de situation, levés topographiques.', structure: 'entreprise', regulatedProfession: 'Géomètre expert', zones: ['Douala', 'Littoral'] },
};

const services = () => FEED_ITEMS.filter((i): i is ServiceFeedItem => i.universe === 'services');

/** Toutes les catégories avec leur état d'activation (back-office). */
export const mockAllServiceCategories = () =>
  CATEGORIES.map((c) => ({
    ...c,
    providerCount: services().filter((s) => s.category === c.code).length,
    active: settingsStore.get().categoriesActive[c.code] ?? true,
  }));

export const mockServiceCategories = (): ServiceCategory[] =>
  mockAllServiceCategories().filter((c) => c.active).map(({ active: _a, ...c }) => c);

export function mockServiceProvider(id: string): ServiceProviderDetail {
  const s = services().find((x) => x.id === id);
  if (!s) throw new ApiError('Prestataire introuvable', 404, 'NOT_FOUND');
  const extra = EXTRA[id] ?? {};
  return {
    ...s,
    description: s.summary,
    structure: 'independant',
    zones: [s.district, s.city].filter(Boolean) as string[],
    ...extra,
    businessName: s.publisher.name,
    badges: { identityVerified: s.publisher.verified, regulatedVerified: s.regulated && s.publisher.verified },
    viewerIsOwner: s.publisher.id === MOCK_ME.id,
  };
}
