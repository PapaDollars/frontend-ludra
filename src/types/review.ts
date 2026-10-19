// types/review.ts — Module 09 : Avis & réputation
import type { CursorPage, ISODate, Publisher } from './common';
import type { ConversationContext } from './messaging';

/** Interaction vérifiable ouvrant droit à un avis (M09). */
export type InteractionKind = 'conversation' | 'contact_unlock' | 'visit';

export type StarRating = 1 | 2 | 3 | 4 | 5;

/** Interaction de l'utilisateur connecté avec un publieur, notable une seule fois. */
export interface ReviewableInteraction {
  id: string;
  kind: InteractionKind;
  subject: Publisher;
  context: ConversationContext | null;
  at: ISODate;
  /** Avis déjà donné pour cette interaction (modifiable), sinon null. */
  reviewId: string | null;
}

export interface ReviewReply {
  text: string;
  createdAt: ISODate;
}

export interface Review {
  id: string;
  author: { id: string; name: string; avatar?: string | null };
  /** Publieur évalué. */
  subjectId: string;
  rating: StarRating;
  comment?: string;
  interactionKind: InteractionKind;
  context: Pick<ConversationContext, 'universe' | 'itemId' | 'title'> | null;
  createdAt: ISODate;
  /** Renseigné si l'auteur a modifié son avis. */
  updatedAt?: ISODate;
  reply: ReviewReply | null;
  /** L'utilisateur connecté est l'auteur (peut modifier). */
  mine: boolean;
  /** L'utilisateur connecté est le publieur évalué et n'a pas encore répondu. */
  canReply: boolean;
}

export interface ReviewSummary {
  /** Moyenne arrondie à 0,1. */
  average: number;
  count: number;
  distribution: Record<StarRating, number>;
}

export interface ReviewPage extends CursorPage<Review> {
  subject: Publisher;
  summary: ReviewSummary;
}

export interface ReviewInput {
  interactionId: string;
  rating: StarRating;
  comment?: string;
}
