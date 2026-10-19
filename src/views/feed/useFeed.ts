import { useCallback } from 'react';
import { useCursorList } from '@/hooks/useCursorList';
import { feedService } from '@/services/feed.service';
import type { FeedFilter, FeedItem } from '@/types';

const PAGE_SIZE = 5;

/** Feed paginé par curseur, rechargé à chaque changement d'onglet. */
export function useFeed(filter: FeedFilter) {
  const fetchPage = useCallback(
    (cursor: string | null) =>
      feedService.getFeed({ universe: filter === 'tous' ? undefined : filter, cursor, limit: PAGE_SIZE }),
    [filter],
  );
  return useCursorList<FeedItem>(fetchPage, filter);
}
