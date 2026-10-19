'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utilis/utils';
import type { StarRating } from '@/types';

export const RATING_LABEL: Record<StarRating, string> = {
  1: 'Très décevant',
  2: 'Décevant',
  3: 'Correct',
  4: 'Très bien',
  5: 'Excellent',
};

/** Note 1–5 : groupe radio natif (flèches clavier), étoiles au survol. */
export function StarInput({ value, onChange, error }: { value: StarRating | null; onChange: (v: StarRating) => void; error?: string }) {
  const [hover, setHover] = useState<StarRating | null>(null);
  const shown = hover ?? value;
  return (
    <fieldset className="flex flex-col items-center gap-1">
      <legend className="sr-only">Votre note</legend>
      <div className="flex gap-1" onMouseLeave={() => setHover(null)}>
        {([1, 2, 3, 4, 5] as StarRating[]).map((n) => (
          <label key={n} onMouseEnter={() => setHover(n)} className="cursor-pointer p-0.5 rounded focus-within:ring-2 focus-within:ring-brand-200">
            <input type="radio" name="rating" value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" aria-label={`${n} sur 5 — ${RATING_LABEL[n]}`} />
            <Star className={cn('w-8 h-8 transition', shown && n <= shown ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')} />
          </label>
        ))}
      </div>
      <p className="text-sm font-semibold text-navy h-5" aria-live="polite">{shown ? `${shown} / 5 · ${RATING_LABEL[shown]}` : ''}</p>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}
