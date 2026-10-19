import api from '@/lib/api';
import { toQuery, withMock } from '@/lib/mock';
import {
  MOCK_ME_ID, mockCreateReview, mockEligibility, mockReply, mockSubjectReviews, mockUpdateReview,
} from '@/mocks/reviews.mock';
import type { ApiResponse, Review, ReviewInput, ReviewPage, ReviewableInteraction, StarRating } from '@/types';

const enc = encodeURIComponent;

export const reviewService = {
  /** GET /users/:id/reviews?rating=&cursor=&limit= — avis publics sur un publieur (token optionnel : mine / canReply). */
  forUser(userId: string, opts: { cursor?: string | null; limit?: number; rating?: StarRating } = {}) {
    return withMock(
      () => mockSubjectReviews(userId, opts.cursor ?? null, opts.limit ?? 10, opts.rating),
      async () => {
        const qs = toQuery(opts);
        return (await api.get<ApiResponse<ReviewPage>>(`/users/${enc(userId)}/reviews${qs ? `?${qs}` : ''}`)).data;
      },
    );
  },

  /** GET /me/reviews/received — avis reçus par l'utilisateur connecté (même forme). */
  received(opts: { cursor?: string | null; limit?: number; rating?: StarRating } = {}) {
    return withMock(
      () => mockSubjectReviews(MOCK_ME_ID, opts.cursor ?? null, opts.limit ?? 10, opts.rating),
      async () => {
        const qs = toQuery(opts);
        return (await api.get<ApiResponse<ReviewPage>>(`/me/reviews/received${qs ? `?${qs}` : ''}`)).data;
      },
    );
  },

  /** GET /reviews/eligibility?subjectId= — mes interactions notables (toutes si subjectId absent). */
  eligibility(subjectId?: string) {
    return withMock(
      () => mockEligibility(subjectId),
      async () => {
        const qs = toQuery({ subjectId });
        return (await api.get<ApiResponse<ReviewableInteraction[]>>(`/reviews/eligibility${qs ? `?${qs}` : ''}`)).data;
      },
    );
  },

  /** POST /reviews — 403 NOT_ELIGIBLE, 409 ALREADY_REVIEWED. */
  create(input: ReviewInput) {
    return withMock(
      () => mockCreateReview(input),
      async () => (await api.post<ApiResponse<Review>>(`/reviews`, input)).data,
    );
  },

  /** PATCH /reviews/:id { rating, comment? } — auteur uniquement (pas de suppression : modération seule). */
  update(id: string, patch: { rating: StarRating; comment?: string }) {
    return withMock(
      () => mockUpdateReview(id, patch),
      async () => (await api.patch<ApiResponse<Review>>(`/reviews/${enc(id)}`, patch)).data,
    );
  },

  /** POST /reviews/:id/reply { text } — publieur évalué, une seule réponse. */
  reply(id: string, text: string) {
    return withMock(
      () => mockReply(id, text),
      async () => (await api.post<ApiResponse<Review>>(`/reviews/${enc(id)}/reply`, { text })).data,
    );
  },
};
