import { ReactNode } from 'react';
import { cn } from '@/utilis/utils';

const TONES = {
  brand: 'bg-brand text-white',
  'brand-soft': 'bg-brand-50 text-brand-700',
  trust: 'bg-trust text-white',
  'trust-soft': 'bg-trust-50 text-trust',
  perso: 'bg-perso text-white',
  'perso-soft': 'bg-perso-50 text-perso',
  service: 'bg-service text-white',
  'service-soft': 'bg-service-50 text-service',
  caution: 'bg-caution text-white',
  'caution-soft': 'bg-caution-50 text-caution',
  danger: 'bg-red-600 text-white',
  'danger-soft': 'bg-red-50 text-red-600',
  neutral: 'bg-slate-500 text-white',
  'neutral-soft': 'bg-slate-100 text-slate-600',
} as const;

export type PillTone = keyof typeof TONES;

interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}

/** Badge arrondi (VÉRIFIÉ, PREMIUM, Sponsorisé…). */
export function Pill({ tone = 'brand-soft', children, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
