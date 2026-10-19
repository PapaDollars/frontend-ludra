import api, { downloadBlob } from '@/lib/api';
import { withMock } from '@/lib/mock';
import {
  mockAddToShortlist, mockCandidateDetail, mockExportShortlist, mockMyCandidateProfile, mockRecruiterAccess,
  mockRemoveFromShortlist, mockShortlist,
} from '@/mocks/candidate.mock';
import type { ApiResponse, CandidateDetail, CandidateFeedItem, RecruiterAccess, ShortlistEntry } from '@/types';

const enc = encodeURIComponent;

export const candidateService = {
  /** GET /candidates/:id — profil public (token optionnel : viewerAccess, viewerIsOwner). 404 si inconnu. */
  get(id: string, authenticated: boolean) {
    return withMock(
      () => mockCandidateDetail(id, authenticated),
      async () => (await api.get<ApiResponse<CandidateDetail>>(`/candidates/${enc(id)}`)).data,
    );
  },

  /** GET /me/candidate-profile — mon profil candidat, ou null. */
  myProfile() {
    return withMock(
      () => mockMyCandidateProfile(),
      async () => (await api.get<ApiResponse<CandidateFeedItem | null>>(`/me/candidate-profile`)).data,
    );
  },

  /** GET /recruiter/access — forfait recruteur actif et droits (auth). */
  recruiterAccess() {
    return withMock(
      () => mockRecruiterAccess(),
      async () => (await api.get<ApiResponse<RecruiterAccess>>(`/recruiter/access`)).data,
    );
  },

  /** GET /recruiter/shortlist — 403 PLAN_REQUIRED sans forfait. */
  shortlist() {
    return withMock(
      () => mockShortlist(),
      async () => (await api.get<ApiResponse<ShortlistEntry[]>>(`/recruiter/shortlist`)).data,
    );
  },

  /** POST /recruiter/shortlist { candidateId } — idempotent. */
  addToShortlist(candidateId: string) {
    return withMock(
      () => mockAddToShortlist(candidateId),
      async () => (await api.post<ApiResponse<ShortlistEntry[]>>(`/recruiter/shortlist`, { candidateId })).data,
    );
  },

  /** DELETE /recruiter/shortlist/:candidateId */
  removeFromShortlist(candidateId: string) {
    return withMock(
      () => mockRemoveFromShortlist(candidateId),
      async () => (await api.delete<ApiResponse<ShortlistEntry[]>>(`/recruiter/shortlist/${enc(candidateId)}`)).data,
    );
  },

  /** GET /recruiter/shortlist/export — CSV (droit exportShortlist). */
  exportShortlist() {
    return withMock(
      () => mockExportShortlist(),
      () => downloadBlob(`/recruiter/shortlist/export`),
    );
  },
};
