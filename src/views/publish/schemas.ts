// Validation champ par champ du wizard (M06). Le serveur revalide tout à la publication.
import { z } from 'zod';
import type { PublishDraft, Universe } from '@/types';

const text = (label: string, min: number, max: number) =>
  z.string({ error: `${label} : champ requis.` })
    .trim()
    .min(min, { error: `${label} : ${min} caractères minimum.` })
    .max(max, { error: `${label} : ${max} caractères maximum.` });

const amount = (label: string) =>
  z.number({ error: `Indiquez ${label}.` }).int({ error: 'Montant entier attendu.' }).positive({ error: 'Le montant doit être positif.' });

const optAmount = z.number().int().positive({ error: 'Le montant doit être positif.' }).optional();
const city = z.string({ error: 'Choisissez une ville.' }).min(1, { error: 'Choisissez une ville.' });

const NO_BEDROOMS = ['terrain', 'bureau', 'commerce'];

// ── Immobilier ──
const listingProfile = z.object({
  publisherRole: z.enum(['owner', 'agent'], { error: 'Choisissez votre statut.' }),
  agencyName: z.string().trim().max(80).optional(),
}).superRefine((v, ctx) => {
  if (v.publisherRole === 'agent' && !v.agencyName) {
    ctx.addIssue({ code: 'custom', path: ['agencyName'], message: "Indiquez le nom de l'agence ou du mandant." });
  }
});

const listingDetails = z.object({
  transaction: z.enum(['location', 'vente'], { error: 'Location ou vente ?' }),
  propertyKind: z.enum(['appartement', 'studio', 'chambre', 'maison', 'villa', 'terrain', 'bureau', 'commerce'], { error: 'Choisissez le type de bien.' }),
  title: text('Titre', 10, 90),
  description: text('Description', 30, 3000),
  city,
  district: z.string().optional(),
  price: amount('le prix'),
  priceUnit: z.enum(['mois', 'nuit', 'total'], { error: 'Choisissez la périodicité.' }),
  bedrooms: z.number().int().min(0).max(50, { error: '50 maximum.' }).optional(),
  bathrooms: z.number().int().min(0).max(50, { error: '50 maximum.' }).optional(),
  surface: z.number().positive({ error: 'Surface invalide.' }).max(1_000_000).optional(),
  amenities: z.array(z.string()).optional(),
  availableNow: z.boolean().optional(),
}).superRefine((v, ctx) => {
  if (v.propertyKind === 'terrain' && v.surface === undefined) {
    ctx.addIssue({ code: 'custom', path: ['surface'], message: 'Indiquez la surface du terrain.' });
  }
  if (v.propertyKind && !NO_BEDROOMS.includes(v.propertyKind) && v.bedrooms === undefined) {
    ctx.addIssue({ code: 'custom', path: ['bedrooms'], message: 'Indiquez le nombre de chambres.' });
  }
});

// ── Personnel (profil candidat) ──
const candidateProfile = z.object({
  job: z.string({ error: 'Choisissez votre métier.' }).min(1, { error: 'Choisissez votre métier.' }),
});

const candidateDetails = z.object({
  title: text('Titre du profil', 10, 90),
  summary: text('Présentation', 30, 1500),
  city,
  district: z.string().optional(),
  experienceYears: z.number({ error: "Indiquez vos années d'expérience." }).int().min(0).max(60, { error: '60 ans maximum.' }),
  availability: z.enum(['immediate', 'sous_15_jours', 'a_convenir'], { error: 'Indiquez votre disponibilité.' }),
  salaryMin: optAmount,
  salaryMax: optAmount,
  skills: z.array(z.string().max(30)).max(10, { error: '10 compétences maximum.' }).optional(),
  training: z.string().trim().max(300, { error: '300 caractères maximum.' }).optional(),
}).superRefine((v, ctx) => {
  if (v.salaryMin !== undefined && v.salaryMax !== undefined && v.salaryMin > v.salaryMax) {
    ctx.addIssue({ code: 'custom', path: ['salaryMax'], message: 'Le maximum doit être supérieur au minimum.' });
  }
});

// ── Autres services ──
const serviceProfile = z.object({
  category: z.string({ error: 'Choisissez une catégorie.' }).min(1, { error: 'Choisissez une catégorie.' }),
  structure: z.enum(['independant', 'entreprise'], { error: 'Indépendant ou entreprise ?' }),
  businessName: z.string().trim().max(80).optional(),
}).superRefine((v, ctx) => {
  if (v.structure === 'entreprise' && !v.businessName) {
    ctx.addIssue({ code: 'custom', path: ['businessName'], message: "Indiquez le nom de l'entreprise." });
  }
});

const serviceDetails = z.object({
  title: text('Titre', 10, 90),
  description: text('Description', 30, 2000),
  city,
  priceFrom: optAmount,
});

const SCHEMAS = {
  immobilier: { profile: listingProfile, details: listingDetails },
  personnel: { profile: candidateProfile, details: candidateDetails },
  services: { profile: serviceProfile, details: serviceDetails },
} as const;

export const MEDIA_RULES: Record<Universe, { min: number; max: number; label: string }> = {
  immobilier: { min: 1, max: 10, label: 'Photos du bien (1 minimum, 10 maximum). La première est la couverture.' },
  personnel: { min: 0, max: 1, label: 'Photo de profil (facultative). Visage net, sans document d’identité.' },
  services: { min: 0, max: 6, label: 'Photos de réalisations (facultatives, 6 maximum).' },
};

export type FieldErrors = Record<string, string>;

/** Données de l'univers du brouillon. */
export const dataOf = (d: PublishDraft) =>
  d.type === 'immobilier' ? d.listing : d.type === 'personnel' ? d.candidate : d.service;

/** Erreurs d'une étape (1 profil · 2 détails · 3 médias), indexées par nom de champ. */
export function validateStep(d: PublishDraft, step: number): FieldErrors {
  if (!d.type) return step === 0 ? {} : { type: 'Choisissez un type de publication.' };
  if (step === 3) {
    const { min, max } = MEDIA_RULES[d.type];
    if (d.media.length < min) return { media: `Ajoutez au moins ${min} photo${min > 1 ? 's' : ''}.` };
    if (d.media.length > max) return { media: `${max} photo${max > 1 ? 's' : ''} maximum.` };
    return {};
  }
  const schema = step === 1 ? SCHEMAS[d.type].profile : step === 2 ? SCHEMAS[d.type].details : null;
  if (!schema) return {};
  const res = schema.safeParse(dataOf(d));
  if (res.success) return {};
  const errors: FieldErrors = {};
  for (const issue of res.error.issues) {
    const key = String(issue.path[0] ?? 'form');
    errors[key] ??= issue.message;
  }
  return errors;
}

/** Première étape invalide (pour la validation finale), ou null. */
export function firstInvalidStep(d: PublishDraft): number | null {
  for (const step of [1, 2, 3]) if (Object.keys(validateStep(d, step)).length) return step;
  return null;
}

/** Étape d'un champ renvoyé en erreur par le serveur. */
export function stepOfField(d: PublishDraft, field: string): number {
  if (field === 'media') return 3;
  if (field === 'type') return 0;
  if (!d.type) return 0;
  return field in SCHEMAS[d.type].profile.shape ? 1 : 2;
}
