import type { ReviewSummary, StarRating } from '@/types';
import { Rating } from '@/components/ui/Rating';

/** Moyenne + volume + répartition (critère M09 « moyenne + volume affichés »). */
export function ReviewSummaryCard({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="flex items-center gap-6">
      <div className="text-center shrink-0">
        <p className="text-4xl font-bold text-navy">{summary.count ? summary.average.toFixed(1).replace('.', ',') : '–'}</p>
        <Rating value={summary.count ? summary.average : undefined} count={summary.count} className="justify-center" />
      </div>
      <ul className="flex-1 space-y-1" aria-label="Répartition des notes">
        {([5, 4, 3, 2, 1] as StarRating[]).map((n) => {
          const c = summary.distribution[n] ?? 0;
          const pct = summary.count ? (c / summary.count) * 100 : 0;
          return (
            <li key={n} className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-3">{n}</span>
              <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <span className="block h-full bg-amber-400" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-6 text-right" aria-label={`${c} avis à ${n} étoiles`}>{c}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
