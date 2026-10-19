'use client';

import { ReactNode, useCallback } from 'react';
import { useCursorList } from '@/hooks/useCursorList';
import { searchService } from '@/services/search.service';
import type { FeedItem, SearchFilters } from '@/types';
import { FeedList } from '@/views/feed/components/FeedList';

const PAGE_SIZE = 10;

interface SearchResultsProps {
  filters: SearchFilters;
  /** Clé stable des filtres appliqués (query string) : recharge la liste quand elle change. */
  filtersKey: string;
  header: (total: number | null) => ReactNode;
}

export function SearchResults({ filters, filtersKey, header }: SearchResultsProps) {
  const fetchPage = useCallback(
    (cursor: string | null) => searchService.search(filters, cursor, PAGE_SIZE),
    // filtersKey résume `filters`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey],
  );
  const list = useCursorList<FeedItem>(fetchPage, filtersKey);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {header(list.loading && list.items.length === 0 ? null : list.total)}
      <FeedList
        {...list}
        label="Résultats de recherche"
        emptyText="Aucune offre ne correspond à ces critères. Élargissez la zone ou le budget, ou enregistrez la recherche pour être alerté."
      />
    </div>
  );
}
