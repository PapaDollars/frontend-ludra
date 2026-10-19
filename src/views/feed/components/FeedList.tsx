'use client';

import { useInfiniteSentinel } from '@/hooks/useCursorList';
import type { FeedItem } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { useItemActions } from '../useItemActions';
import { FeedCard } from './FeedCard';
import { FeedSkeleton } from './FeedSkeleton';

interface FeedListProps {
  items: FeedItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
  updateItem: (id: string, patch: Partial<FeedItem>) => void;
  emptyText?: string;
  label?: string;
}

/** Liste de cartes avec scroll infini, squelettes, erreur et état vide. */
export function FeedList({
  items, loading, error, hasMore, loadMore, retry, updateItem,
  emptyText = 'Aucune offre pour le moment dans cette rubrique.',
  label = 'Offres',
}: FeedListProps) {
  const { show: showToast, node: toastNode } = useToast();
  const { onToggleSave, onShare } = useItemActions(updateItem, showToast);
  const sentinel = useInfiniteSentinel(loadMore);

  return (
    <section aria-label={label} aria-busy={loading} className="flex flex-col gap-3 md:gap-4">
      {items.map((item) => (
        <FeedCard key={item.id} item={item} onToggleSave={onToggleSave} onShare={onShare} />
      ))}

      {loading && <FeedSkeleton count={items.length === 0 ? 2 : 1} />}

      {error && (
        <div className="mx-4 md:mx-0 rounded-2xl bg-white border border-red-100 p-6 text-center">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button type="button" onClick={retry} className="h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold">Réessayer</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="mx-4 md:mx-0 rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">{emptyText}</p>
      )}

      {!hasMore && items.length > 0 && <p className="text-center text-xs text-slate-400 py-4">Vous avez tout vu 👋</p>}
      <div ref={sentinel} />
      {toastNode}
    </section>
  );
}
