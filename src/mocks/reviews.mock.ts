// mocks/reviews.mock.ts — Avis & réputation (démo)
//
// - Avis générés pour les publieurs de démo, cohérents avec la note affichée dans le feed.
// - Éligibilité : conversations existantes + contacts débloqués (une interaction = un avis).
// - Les avis donnés / réponses sont gardés dans le localStorage.
import { ApiError } from '@/lib/api';
import { maskContactInfo } from '@/lib/messageSafety';
import type {
  Publisher, Review, ReviewInput, ReviewPage, ReviewSummary, ReviewableInteraction, StarRating,
} from '@/types';
import { FEED_ITEMS, MOCK_ME } from './feed.mock';
import { mockListConversations } from './messages.mock';
import { mockUnlockedListingIds } from './listing.mock';
import { persisted } from './storage';

const DAY = 86_400_000;
const ME_AUTHOR = { id: MOCK_ME.id, name: 'Vous' };

const AUTHORS = ['Paul E.', 'Aïcha M.', 'Serge N.', 'Brigitte K.', 'Hervé T.', 'Linda F.', 'Didier O.', 'Carine B.', 'Yannick D.', 'Mireille A.'];
const COMMENTS: Record<StarRating, string[]> = {
  5: ['Ponctuel, visite organisée et informations claires.', 'Très professionnel, je recommande.', 'Annonce conforme, échanges rapides.', ''],
  4: ['Bon contact, quelques retards de réponse.', 'Conforme à l’annonce dans l’ensemble.', ''],
  3: ['Correct, mais photos un peu flatteuses.', ''],
  2: ['Visite reportée deux fois.'],
  1: ['Injoignable après le premier échange.'],
};

/** Publieurs connus (feed + conversations). */
function publisherById(id: string): Publisher | undefined {
  if (id === MOCK_ME.id) return MOCK_ME;
  return FEED_ITEMS.find((i) => i.publisher.id === id)?.publisher
    ?? mockListConversations().items.find((c) => c.participant.id === id)?.participant;
}

/** Notes générées pour coller à la moyenne affichée (ex. 4,7 sur 26 avis). */
function generate(p: Publisher): Review[] {
  const count = p.reviewsCount ?? (p.id === MOCK_ME.id ? 2 : 0);
  const avg = p.rating ?? 4.5;
  const n5 = Math.max(0, Math.min(count, Math.round((avg - 4) * count)));
  return Array.from({ length: count }, (_, i) => {
    const rating = (i < n5 ? 5 : i === count - 1 && avg < 4.3 && count > 3 ? 3 : 4) as StarRating;
    const pool = COMMENTS[rating];
    return {
      id: `rv-${p.id}-${i}`,
      author: { id: `a-${i}`, name: AUTHORS[i % AUTHORS.length] },
      subjectId: p.id,
      rating,
      comment: pool[i % pool.length] || undefined,
      interactionKind: i % 3 === 0 ? 'contact_unlock' : 'conversation',
      context: null,
      createdAt: new Date(Date.now() - (i + 1) * 3.5 * DAY).toISOString(),
      reply: i === 1 ? { text: 'Merci pour votre retour, au plaisir !', createdAt: new Date(Date.now() - (i + 0.5) * 3.5 * DAY).toISOString() } : null,
      mine: false,
      canReply: false,
    };
  });
}

interface Stored {
  /** Avis donnés par l'utilisateur de démo (interactionId → avis). */
  given: Record<string, Review>;
  /** Réponses du publieur de démo (reviewId → réponse). */
  replies: Record<string, Review['reply']>;
}
const store = persisted<Stored>('ludra.mock.reviews', () => ({ given: {}, replies: {} }));

function reviewsOf(subjectId: string): Review[] {
  const p = publisherById(subjectId);
  if (!p) throw new ApiError('Utilisateur introuvable', 404, 'NOT_FOUND');
  const { given, replies } = store.get();
  const mine = Object.values(given).filter((r) => r.subjectId === subjectId).map((r) => ({ ...r, mine: true }));
  const isMe = subjectId === MOCK_ME.id;
  const base = generate(p).map((r) => {
    const reply = replies[r.id] ?? r.reply;
    return { ...r, reply, canReply: isMe && !reply };
  });
  return [...mine, ...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function summarize(list: Review[]): ReviewSummary {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<StarRating, number>;
  list.forEach((r) => { distribution[r.rating] += 1; });
  const sum = list.reduce((n, r) => n + r.rating, 0);
  return { average: list.length ? Math.round((sum / list.length) * 10) / 10 : 0, count: list.length, distribution };
}

export function mockSubjectReviews(subjectId: string, cursor: string | null, limit: number, rating?: StarRating): ReviewPage {
  const all = reviewsOf(subjectId);
  const filtered = rating ? all.filter((r) => r.rating === rating) : all;
  const start = cursor ? Number(cursor) : 0;
  const next = start + limit;
  return {
    subject: publisherById(subjectId)!,
    summary: summarize(all),
    items: filtered.slice(start, next),
    nextCursor: next < filtered.length ? String(next) : null,
    total: filtered.length,
  };
}

export function mockEligibility(subjectId?: string): ReviewableInteraction[] {
  const { given } = store.get();
  const fromConversations: ReviewableInteraction[] = mockListConversations().items.map((c) => ({
    id: `int-cv-${c.id}`, kind: 'conversation', subject: c.participant, context: c.context, at: c.updatedAt,
    reviewId: given[`int-cv-${c.id}`]?.id ?? null,
  }));
  const fromUnlocks: ReviewableInteraction[] = mockUnlockedListingIds().flatMap((id) => {
    const item = FEED_ITEMS.find((i) => i.id === id);
    if (!item) return [];
    return [{
      id: `int-ul-${id}`, kind: 'contact_unlock' as const, subject: item.publisher,
      context: { universe: item.universe, itemId: item.id, title: item.title }, at: new Date().toISOString(),
      reviewId: given[`int-ul-${id}`]?.id ?? null,
    }];
  });
  return [...fromConversations, ...fromUnlocks].filter((i) => !subjectId || i.subject.id === subjectId);
}

export function mockCreateReview(input: ReviewInput): Review {
  const interaction = mockEligibility().find((i) => i.id === input.interactionId);
  if (!interaction) throw new ApiError("Avis possible uniquement après une interaction vérifiable.", 403, 'NOT_ELIGIBLE');
  if (interaction.reviewId) throw new ApiError('Vous avez déjà donné un avis pour cette interaction.', 409, 'ALREADY_REVIEWED');
  const review: Review = {
    id: `rv-mine-${Date.now()}`, author: ME_AUTHOR, subjectId: interaction.subject.id, rating: input.rating,
    comment: input.comment ? maskContactInfo(input.comment).text : undefined,
    interactionKind: interaction.kind, context: interaction.context && { universe: interaction.context.universe, itemId: interaction.context.itemId, title: interaction.context.title },
    createdAt: new Date().toISOString(), reply: null, mine: true, canReply: false,
  };
  const s = store.get();
  store.set({ ...s, given: { ...s.given, [input.interactionId]: review } });
  return review;
}

export function mockUpdateReview(id: string, patch: { rating: StarRating; comment?: string }): Review {
  const s = store.get();
  const entry = Object.entries(s.given).find(([, r]) => r.id === id);
  if (!entry) throw new ApiError('Avis introuvable', 404, 'NOT_FOUND');
  const updated: Review = {
    ...entry[1], rating: patch.rating, comment: patch.comment ? maskContactInfo(patch.comment).text : undefined, updatedAt: new Date().toISOString(),
  };
  store.set({ ...s, given: { ...s.given, [entry[0]]: updated } });
  return updated;
}

export function mockReply(reviewId: string, text: string): Review {
  const review = reviewsOf(MOCK_ME.id).find((r) => r.id === reviewId);
  if (!review) throw new ApiError('Vous ne pouvez répondre qu’aux avis vous concernant.', 403, 'FORBIDDEN');
  if (review.reply) throw new ApiError('Une seule réponse par avis.', 409, 'ALREADY_REPLIED');
  const reply = { text: maskContactInfo(text).text, createdAt: new Date().toISOString() };
  const s = store.get();
  store.set({ ...s, replies: { ...s.replies, [reviewId]: reply } });
  return { ...review, reply, canReply: false };
}

export const MOCK_ME_ID = MOCK_ME.id;
