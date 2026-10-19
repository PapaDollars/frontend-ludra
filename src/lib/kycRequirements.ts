// lib/kycRequirements.ts — Pièces requises par profil (M07). Le serveur applique les mêmes règles.
import type { KycDocumentType, KycDossier, KycProfile, KycStatus } from '@/types';

export interface KycRequirement {
  key: string;
  label: string;
  hint: string;
  kind: 'document' | 'location';
  /** L'un de ces types suffit. */
  docTypes?: KycDocumentType[];
  /** Faces exigées (CNI). */
  sides?: ('recto' | 'verso')[];
}

const IDENTITY: KycRequirement = {
  key: 'identity', kind: 'document', label: "Carte d'identité", hint: 'Recto / verso lisibles, en cours de validité', docTypes: ['identity'], sides: ['recto', 'verso'],
};

export function requirementsFor(profile: KycProfile): KycRequirement[] {
  return profile === 'owner'
    ? [
      IDENTITY,
      { key: 'property_proof', kind: 'document', label: 'Preuve liée au bien', hint: 'Titre foncier, attestation ou justificatif selon le cas', docTypes: ['property_proof'] },
      { key: 'location', kind: 'location', label: 'Localisation du bien', hint: 'Quartier + point carte' },
    ]
    : [
      IDENTITY,
      { key: 'professional', kind: 'document', label: 'Carte professionnelle ou mandat', hint: 'Preuve de qualité : carte pro, mandat de gestion ou de vente', docTypes: ['professional_card', 'mandate'] },
      { key: 'location', kind: 'location', label: 'Biens / localisations', hint: 'Au moins un lieu où vous exercez' },
    ];
}

export function isRequirementMet(req: KycRequirement, d: KycDossier): boolean {
  if (req.kind === 'location') return d.locations.length > 0;
  const docs = d.documents.filter((doc) => req.docTypes!.includes(doc.type) && doc.status !== 'rejected');
  return req.sides ? req.sides.every((s) => docs.some((doc) => doc.side === s)) : docs.length > 0;
}

export const missingRequirements = (d: KycDossier) =>
  d.profile ? requirementsFor(d.profile).filter((r) => !isRequirementMet(r, d)) : [];

/** Statuts où l'utilisateur peut modifier son dossier. */
export const KYC_EDITABLE: KycStatus[] = ['a_completer', 'rejete', 'expire'];

export const KYC_STATUS_LABEL: Record<KycStatus, string> = {
  a_completer: 'À compléter',
  soumis: 'Soumis',
  en_revue: 'En revue',
  verifie: 'Vérifié',
  rejete: 'Rejeté',
  expire: 'Expiré',
};

export const KYC_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const KYC_MAX_BYTES = 10 * 1024 * 1024;
