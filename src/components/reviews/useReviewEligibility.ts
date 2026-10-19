import { useCallback, useEffect, useState } from 'react';
import { reviewService } from '@/services/review.service';
import type { ReviewableInteraction } from '@/types';

/** Interactions de l'utilisateur connecté avec `subjectId` ; `pending` = celles non encore évaluées. */
export function useReviewEligibility(subjectId: string | undefined, enabled: boolean) {
  const [interactions, setInteractions] = useState<ReviewableInteraction[]>([]);

  const refresh = useCallback(async () => {
    if (!subjectId || !enabled) { setInteractions([]); return; }
    try { setInteractions(await reviewService.eligibility(subjectId)); } catch { setInteractions([]); }
  }, [subjectId, enabled]);

  useEffect(() => { refresh(); }, [refresh]);

  return { interactions, pending: interactions.filter((i) => !i.reviewId), refresh };
}
