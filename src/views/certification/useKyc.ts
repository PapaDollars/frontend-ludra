import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { kycService } from '@/services/kyc.service';
import type { KycDocumentType, KycDossier, KycLocation, KycProfile } from '@/types';

const POLL_MS = 5000;

/** Mon dossier de certification ; rafraîchi tant qu'il est en cours de vérification. */
export function useKyc(enabled: boolean) {
  const [dossier, setDossier] = useState<KycDossier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setDossier(await kycService.get());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger votre dossier.');
    }
  }, []);

  useEffect(() => { if (enabled) refresh(); }, [enabled, refresh]);

  const inReview = dossier?.status === 'soumis' || dossier?.status === 'en_revue';
  useEffect(() => {
    if (!inReview) return;
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [inReview, refresh]);

  const setProfile = useCallback(async (profile: KycProfile) => {
    setDossier(await kycService.setProfile(profile));
  }, []);

  const upload = useCallback(async (file: File, type: KycDocumentType, side?: 'recto' | 'verso') => {
    await kycService.uploadDocument(file, type, side);
    await refresh();
  }, [refresh]);

  const removeDocument = useCallback(async (id: string) => {
    setDossier(await kycService.deleteDocument(id));
  }, []);

  const setLocations = useCallback(async (locations: KycLocation[]) => {
    setDossier(await kycService.setLocations(locations));
  }, []);

  /** Renvoie la liste des erreurs serveur (422), vide si soumis. */
  const submit = useCallback(async (): Promise<string[]> => {
    try {
      setDossier(await kycService.submit());
      return [];
    } catch (e) {
      if (e instanceof ApiError && e.errors?.length) return e.errors.map((x) => x.message ?? x.msg ?? '').filter(Boolean);
      return [e instanceof Error ? e.message : 'Soumission impossible.'];
    }
  }, []);

  return { dossier, error, refresh, setProfile, upload, removeDocument, setLocations, submit };
}
