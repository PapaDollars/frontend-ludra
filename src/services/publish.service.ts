import api from '@/lib/api';
import { withMock } from '@/lib/mock';
import {
  mockCreateDraft, mockDeleteDraft, mockGetDraft, mockListDrafts, mockPublish, mockUpdateDraft, mockUpload,
} from '@/mocks/publish.mock';
import type { ApiResponse, PublishDraft, PublishDraftPatch, PublishResult, UploadedMedia } from '@/types';

const enc = encodeURIComponent;

export const publishService = {
  /** GET /drafts — mes brouillons de publication, plus récents d'abord (auth). */
  listDrafts() {
    return withMock(
      () => mockListDrafts(),
      async () => (await api.get<ApiResponse<PublishDraft[]>>(`/drafts`)).data,
    );
  },

  /** POST /drafts — crée un brouillon (au choix du type). */
  createDraft(patch: PublishDraftPatch) {
    return withMock(
      () => mockCreateDraft(patch),
      async () => (await api.post<ApiResponse<PublishDraft>>(`/drafts`, patch)).data,
    );
  },

  /** GET /drafts/:id */
  getDraft(id: string) {
    return withMock(
      () => mockGetDraft(id),
      async () => (await api.get<ApiResponse<PublishDraft>>(`/drafts/${enc(id)}`)).data,
    );
  },

  /** PATCH /drafts/:id — sauvegarde automatique (aucune validation bloquante côté serveur). */
  updateDraft(id: string, patch: PublishDraftPatch) {
    return withMock(
      () => mockUpdateDraft(id, patch),
      async () => (await api.patch<ApiResponse<PublishDraft>>(`/drafts/${enc(id)}`, patch)).data,
    );
  },

  /** DELETE /drafts/:id */
  deleteDraft(id: string) {
    return withMock(
      () => mockDeleteDraft(id),
      async () => { await api.delete(`/drafts/${enc(id)}`); },
    );
  },

  /** POST /uploads (multipart : file, purpose) — image JPG/PNG/WebP ≤ 10 Mo. */
  upload(file: File, purpose: 'publication_media' = 'publication_media') {
    return withMock(
      () => mockUpload(file),
      async () => {
        const form = new FormData();
        form.append('file', file);
        form.append('purpose', purpose);
        return (await api.post<ApiResponse<UploadedMedia>>(`/uploads`, form)).data;
      },
    );
  },

  /** POST /drafts/:id/publish — validation complète serveur ; 422 + errors[{ field, message }] si invalide. */
  publish(id: string) {
    return withMock(
      () => mockPublish(id),
      async () => (await api.post<ApiResponse<PublishResult>>(`/drafts/${enc(id)}/publish`)).data,
    );
  },
};
