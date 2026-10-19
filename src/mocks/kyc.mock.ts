// mocks/kyc.mock.ts — Dossier de certification (démo)
//
// Simulation : après soumission, le dossier passe "en_revue" (~5 s) puis "verifie" (~10 s).
// Un fichier dont le nom contient "flou" provoque un rejet avec motif.
import { ApiError } from '@/lib/api';
import { KYC_EDITABLE, missingRequirements } from '@/lib/kycRequirements';
import type { KycDocument, KycDocumentType, KycDossier, KycLocation, KycProfile, KycStatus } from '@/types';
import { mockHasActive } from './subscription.mock';
import { persisted } from './storage';

const REVIEW_AFTER_MS = 5000;
const DECISION_AFTER_MS = 10_000;

const empty = (): KycDossier => ({
  profile: null, status: 'a_completer', documents: [], locations: [], badgeActive: false,
  history: [{ status: 'a_completer', at: new Date().toISOString() }],
});

const store = persisted<KycDossier>('ludra.mock.kyc', empty);

const now = () => new Date().toISOString();

function transition(d: KycDossier, status: KycStatus, note?: string): KycDossier {
  return { ...d, status, history: [...d.history, { status, at: now(), ...(note ? { note } : {}) }] };
}

/** Avance la revue simulée puis calcule le badge (vérifié + abonnement actif). */
function current(): KycDossier {
  let d = store.get();
  const since = d.submittedAt ? Date.now() - new Date(d.submittedAt).getTime() : 0;
  if (d.status === 'soumis' && since > REVIEW_AFTER_MS) d = transition(d, 'en_revue');
  if (d.status === 'en_revue' && since > DECISION_AFTER_MS) {
    const blurry = d.documents.find((doc) => doc.fileName.toLowerCase().includes('flou'));
    if (blurry) {
      const reason = 'Pièce illisible : envoyez un scan net, sans reflet.';
      d = transition({
        ...d, reviewedAt: now(), rejectionReason: reason,
        documents: d.documents.map((doc) => (doc.id === blurry.id ? { ...doc, status: 'rejected', rejectionReason: reason } : doc)),
      }, 'rejete', reason);
    } else {
      d = transition({
        ...d, reviewedAt: now(), rejectionReason: undefined,
        expiresAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
        documents: d.documents.map((doc) => ({ ...doc, status: 'accepted' })),
      }, 'verifie');
    }
  }
  d = { ...d, badgeActive: d.status === 'verifie' && mockHasActive('owner_agent') };
  store.set(d);
  return d;
}

function editable(): KycDossier {
  const d = current();
  if (!KYC_EDITABLE.includes(d.status)) throw new ApiError('Dossier en cours de vérification : modification impossible.', 409, 'KYC_LOCKED');
  return d;
}

export const mockGetKyc = () => current();

export function mockSetKycProfile(profile: KycProfile): KycDossier {
  const d = editable();
  store.set({ ...d, profile });
  return current();
}

export function mockUploadKycDocument(file: File, type: KycDocumentType, side?: 'recto' | 'verso'): KycDocument {
  const d = editable();
  const doc: KycDocument = {
    id: `kd-${Date.now()}`, type, ...(side ? { side } : {}), fileName: file.name, uploadedAt: now(), status: 'uploaded',
  };
  // Remplace la pièce de même type / face.
  const others = d.documents.filter((x) => !(x.type === type && x.side === side));
  store.set({ ...d, documents: [...others, doc] });
  return doc;
}

export function mockDeleteKycDocument(id: string): KycDossier {
  const d = editable();
  store.set({ ...d, documents: d.documents.filter((x) => x.id !== id) });
  return current();
}

export function mockSetKycLocations(locations: KycLocation[]): KycDossier {
  const d = editable();
  store.set({ ...d, locations });
  return current();
}

export function mockSubmitKyc(): KycDossier {
  const d = editable();
  if (!d.profile) throw new ApiError('Choisissez votre profil.', 422, 'VALIDATION_ERROR', [{ field: 'profile', message: 'Choisissez votre profil.' }]);
  const missing = missingRequirements(d);
  if (missing.length) {
    throw new ApiError('Dossier incomplet.', 422, 'VALIDATION_ERROR', missing.map((r) => ({ field: r.key, message: `${r.label} manquant(e).` })));
  }
  store.set(transition({ ...d, submittedAt: now(), rejectionReason: undefined }, 'soumis'));
  return current();
}
