'use client';

import { useRef, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utilis/utils';
import type { Media } from '@/types';

/** Carrousel médias : swipe natif (scroll-snap) sur mobile, flèches sur desktop. */
export function MediaCarousel({ media, title }: { media: Media[]; title: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const target = Math.max(0, Math.min(media.length - 1, i));
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (media.length === 0) {
    return (
      <div className="aspect-[16/10] max-h-[480px] w-full flex items-center justify-center bg-gradient-to-b from-brand-50 to-slate-100">
        <Building2 className="w-16 h-16 text-brand-200" />
      </div>
    );
  }

  return (
    <div className="relative group" role="region" aria-roledescription="carrousel" aria-label={`Photos — ${title}`}>
      <div
        ref={track}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar aspect-[16/10] max-h-[480px] w-full bg-slate-100"
      >
        {media.map((m, i) => (
          <div key={m.url} className="w-full h-full shrink-0 snap-center" aria-roledescription="diapositive" aria-label={`${i + 1} sur ${media.length}`}>
            {failed[i] ? (
              <div className="w-full h-full flex items-center justify-center"><Building2 className="w-16 h-16 text-brand-200" /></div>
            ) : (
              <img
                src={m.url}
                alt={m.alt || `${title} — photo ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Photo précédente"
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/90 shadow text-navy disabled:opacity-0 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === media.length - 1}
            aria-label="Photo suivante"
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/90 shadow text-navy disabled:opacity-0 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5" aria-hidden="true">
            {media.map((m, i) => (
              <span key={m.url} className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60')} />
            ))}
          </div>
          <span className="absolute top-3 right-3 rounded-full bg-navy/70 text-white text-xs px-2 py-0.5" aria-live="polite">
            {index + 1} / {media.length}
          </span>
        </>
      )}
    </div>
  );
}
