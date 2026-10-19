import { Check } from 'lucide-react';
import { cn } from '@/utilis/utils';

export const STEPS = ['Type', 'Profil', 'Détails', 'Médias', 'Validation'] as const;

interface StepperProps {
  current: number;
  /** Étape la plus avancée atteinte : les étapes ≤ sont cliquables. */
  reached: number;
  onGo: (step: number) => void;
}

export function Stepper({ current, reached, onGo }: StepperProps) {
  return (
    <nav aria-label="Étapes de publication">
      {/* Mobile : compact */}
      <div className="md:hidden flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">Étape {current + 1}/{STEPS.length} · <span className="text-navy">{STEPS[current]}</span></p>
        <div className="flex gap-1" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s} className={cn('h-1.5 rounded-full', i === current ? 'w-5 bg-brand' : i < current ? 'w-1.5 bg-brand' : 'w-1.5 bg-slate-200')} />
          ))}
        </div>
      </div>

      {/* Desktop : étapes reliées */}
      <ol className="hidden md:flex items-start">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = i <= reached && i !== current;
          return (
            <li key={label} className="flex-1 flex flex-col items-center relative">
              {i > 0 && <span className={cn('absolute top-3.5 right-1/2 w-full h-0.5 -z-0', i <= current ? 'bg-brand' : 'bg-slate-200')} aria-hidden="true" />}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onGo(i)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'relative z-10 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition',
                  active ? 'bg-brand text-white ring-4 ring-brand-100' : done ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500',
                  clickable && 'hover:ring-4 hover:ring-brand-100',
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </button>
              <span className={cn('mt-1.5 text-[11px]', active ? 'font-semibold text-brand' : 'text-slate-500')}>{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
