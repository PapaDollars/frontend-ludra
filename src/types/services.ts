// types/services.ts — Module 14 : Autres services
import type { ServiceFeedItem } from './feed';
import type { ServiceStructure } from './publish';

/** Catégorie de service, activable en back-office (seules les actives sont renvoyées). */
export interface ServiceCategory {
  code: string;
  label: string;
  /** Sous-titre de la carte, ex. "Manutention & transport". */
  description: string;
  /** Pastille, ex. "DM". */
  initials: string;
  tone: 'brand' | 'service' | 'caution' | 'perso' | 'trust' | 'navy' | 'danger';
  /** Professions réglementées (notaires, géomètres…) : orientation uniquement. */
  regulated: boolean;
  providerCount: number;
}

export interface ServiceProviderDetail extends ServiceFeedItem {
  description: string;
  structure: ServiceStructure;
  businessName?: string;
  /** Quartiers / villes desservis. */
  zones: string[];
  badges: {
    identityVerified: boolean;
    /** Habilitation professionnelle contrôlée (catégories réglementées). */
    regulatedVerified: boolean;
  };
  /** Profession réglementée affichée, ex. "Notaire". */
  regulatedProfession?: string;
  viewerIsOwner: boolean;
}
