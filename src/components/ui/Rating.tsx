import { Star } from 'lucide-react';
import { cn } from '@/utilis/utils';

interface RatingProps {
  value?: number;
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/** Note moyenne sur 5 + volume d'avis (M09 : "moyenne + volume affichés"). */
export function Rating({ value, count, size = 'sm', className }: RatingProps) {
  if (value === undefined || !count) {
    return <span className={cn('text-xs text-slate-400', className)}>Pas encore d&apos;avis</span>;
  }
  const icon = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const rounded = Math.round(value);
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} aria-label={`Note ${value.toFixed(1)} sur 5, ${count} avis`}>
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(icon, i <= rounded ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')} />
        ))}
      </span>
      <span className="text-xs text-slate-500" aria-hidden="true">{value.toFixed(1).replace('.', ',')} · {count} avis</span>
    </span>
  );
}
