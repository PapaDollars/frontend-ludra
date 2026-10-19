'use client';

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/utilis/utils';
import { reviewService } from '@/services/review.service';
import type { Publisher, Review, ReviewPage, ReviewSummary, StarRating } from '@/types';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewSummaryCard } from '@/components/reviews/ReviewSummaryCard';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';
import { ReportDialog } from '@/components/report/ReportDialog';
import { useToast } from '@/components/ui/Toast';

interface ReviewsBoardProps {
  fetchPage: (cursor: string | null, rating?: StarRating) => Promise<ReviewPage>;
  /** Contenu au-dessus de la liste (ex. bouton « Laisser un avis »). */
  actions?: (subject: Publisher) => ReactNode;
  /** Incrémenter pour recharger (après un nouvel avis). */
  reloadKey?: number;
  emptyText: string;
}

/** Synthèse + filtres par note + liste paginée des avis (réponse, signalement, modification). */
export function ReviewsBoard({ fetchPage, actions, reloadKey = 0, emptyText }: ReviewsBoardProps) {
  const [subject, setSubject] = useState<Publisher | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [items, setItems] = useState<Review[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<StarRating | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState<Review | null>(null);
  const [editing, setEditing] = useState<Review | null>(null);
  const { show: showToast, node: toastNode } = useToast();
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const load = useCallback(async (reset: boolean, from: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchRef.current(reset ? null : from, filter);
      setSubject(page.subject);
      setSummary(page.summary);
      setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
      setCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les avis.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(true, null); }, [load, reloadKey]);

  const patch = (r: Review) => setItems((prev) => prev.map((x) => (x.id === r.id ? r : x)));

  const onReply = async (r: Review, text: string) => {
    patch(await reviewService.reply(r.id, text));
    showToast('Réponse publiée');
  };

  if (error && !summary) return <p role="alert" className="p-6 text-center text-sm text-red-600">{error}</p>;
  if (!summary || !subject) return <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;

  return (
    <div className="flex flex-col gap-4">
      <section className="mx-4 md:mx-0 rounded-2xl border border-slate-200 bg-white p-4 md:p-5 flex flex-col gap-4">
        <ReviewSummaryCard summary={summary} />
        {actions?.(subject)}
      </section>

      <div role="group" aria-label="Filtrer par note" className="flex gap-2 overflow-x-auto px-4 md:px-0 no-scrollbar">
        {([undefined, 5, 4, 3, 2, 1] as (StarRating | undefined)[]).map((n) => (
          <button
            key={n ?? 'all'}
            type="button"
            aria-pressed={filter === n}
            onClick={() => setFilter(n)}
            className={cn('shrink-0 h-8 px-3 rounded-full text-xs font-medium border', filter === n ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200')}
          >
            {n ? `${n} ★` : 'Tous'}
          </button>
        ))}
      </div>

      <div className="mx-4 md:mx-0 flex flex-col gap-3">
        {items.map((r) => (
          <ReviewCard key={r.id} review={r} subjectName={subject.name} onReport={setReporting} onEdit={setEditing} onReply={onReply} />
        ))}
        {!loading && items.length === 0 && <p className="rounded-xl bg-white border border-slate-200 p-6 text-center text-sm text-slate-500">{emptyText}</p>}
        {loading && <Loader2 className="mx-auto w-5 h-5 animate-spin text-brand" />}
        {cursor && !loading && (
          <button type="button" onClick={() => load(false, cursor)} className="self-center h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-navy">
            Voir plus d&apos;avis
          </button>
        )}
      </div>

      <ReportDialog
        open={!!reporting}
        onOpenChange={(o) => { if (!o) setReporting(null); }}
        targetType="review"
        targetId={reporting?.id ?? ''}
        onDone={() => showToast('Merci, l’avis sera examiné par la modération')}
      />
      <ReviewDialog
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        subject={subject}
        interactions={[]}
        editing={editing}
        onSaved={(r) => { patch(r); showToast('Avis mis à jour'); load(true, null); }}
      />
      {toastNode}
    </div>
  );
}
