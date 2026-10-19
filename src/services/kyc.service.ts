import api from '@/lib/api';
import { withMock } from '@/lib/mock';
import {
  mockDeleteKycDocument, mockGetKyc, mockSetKycLocations, mockSetKycProfile, mockSubmitKyc, mockUploadKycDocument,
} from '@/mocks/kyc.mock';
import type { ApiResponse, KycDocument, KycDocumentType, KycDossier, KycLocation, KycProfile } from '@/types';

/** Certification (M07) — toutes les routes sont auth et ne concernent que le dossier de l'utilisateur connecté. */
export const kycService = {
  /** GET /kyc — mon dossier (créé vide si inexistant). */
  get() {
    return withMock(
      () => mockGetKyc(),
      async () => (await api.get<ApiResponse<KycDossier>>(`/kyc`)).data,
    );
  },

  /** PUT /kyc/profile { profile } */
  setProfile(profile: KycProfile) {
    return withMock(
      () => mockSetKycProfile(profile),
      async () => (await api.put<ApiResponse<KycDossier>>(`/kyc/profile`, { profile })).data,
    );
  },

  /** POST /kyc/documents — multipart : file, type, side? ; stockage chiffré, jamais d'URL publique. */
  uploadDocument(file: File, type: KycDocumentType, side?: 'recto' | 'verso') {
    return withMock(
      () => mockUploadKycDocument(file, type, side),
      async () => {
        const form = new FormData();
        form.append('file', file);
        form.append('type', type);
        if (side) form.append('side', side);
        return (await api.post<ApiResponse<KycDocument>>(`/kyc/documents`, form)).data;
      },
    );
  },

  /** DELETE /kyc/documents/:id */
  deleteDocument(id: string) {
    return withMock(
      () => mockDeleteKycDocument(id),
      async () => (await api.delete<ApiResponse<KycDossier>>(`/kyc/documents/${encodeURIComponent(id)}`)).data,
    );
  },

  /** PUT /kyc/locations { locations } — remplace la liste. */
  setLocations(locations: KycLocation[]) {
    return withMock(
      () => mockSetKycLocations(locations),
      async () => (await api.put<ApiResponse<KycDossier>>(`/kyc/locations`, { locations })).data,
    );
  },

  /** POST /kyc/submit — 422 + errors si incomplet. */
  submit() {
    return withMock(
      () => mockSubmitKyc(),
      async () => (await api.post<ApiResponse<KycDossier>>(`/kyc/submit`)).data,
    );
  },
};
