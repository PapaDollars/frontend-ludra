import { Check } from 'lucide-react';
import { cn } from '@/utilis/utils';
import { formatAmount } from '@/utilis/format';
import type { Plan } from '@/types';
import { Pill } from '@/components/ui/Pill';

const TONE = {
  trust: { text: 'text-trust', dot: 'text-trust', button: 'bg-trust hover:opacity-90', ring: 'border-trust ring-trust-50' },
  brand: { text: 'text-brand', dot: 'text-brand', button: 'bg-brand hover:bg-brand-700', ring: 'border-brand ring-brand-100' },
  perso: { text: 'text-perso', dot: 'text-perso', button: 'bg-perso hover:opacity-90', ring: 'border-perso ring-perso-50' },
  neutral: { text: 'text-navy', dot: 'text-slate-400', button: 'bg-navy hover:opacity-90', ring: 'border-navy ring-slate-100' },
} as const;

interface PlanCardProps {
  plan: Plan;
  current: boolean;
  onChoose: (plan: Plan) => void;
  /** Libellé du bouton (ex. "Choisir", "Activer"). */
  cta?: string;
}

/** Carte d'un plan administrable (M08, M12, M13). */
export function PlanCard({ plan, current, onChoose, cta = 'Choisir' }: PlanCardProps) {
  const t = TONE[plan.tone];
  return (
    <article
      aria-label={`Plan ${plan.name}`}
      className={cn(
        'relative flex flex-col rounded-2xl border bg-white p-5',
        plan.recommended ? `${t.ring} border-2 ring-4` : 'border-slate-200',
      )}
    >
      <div className="flex items-center gap-2 mb-1 min-h-[22px]">
        {plan.recommended && <Pill tone={plan.tone === 'perso' ? 'perso' : plan.tone === 'trust' ? 'trust' : 'brand'}>Conseillé</Pill>}
        {current && <Pill tone="neutral-soft">Plan actuel</Pill>}
      </div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-navy">{plan.name}</h3>
      <p className={cn('text-2xl font-bold mt-1', t.text)}>
        {plan.price === 0 ? '0 F' : formatAmount(plan.price).replace('FCFA', 'F')}
        {plan.price > 0 && plan.period === 'month' && <span className="text-sm font-semibold"> / mois</span>}
      </p>
      {plan.price > 0 && plan.period === 'pass' && <p className="text-xs text-slate-500">Valable {plan.durationDays} jours</p>}
      <ul className="mt-4 flex-1 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
            <Check className={cn('w-4 h-4 shrink-0 mt-0.5', t.dot)} /> {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={current}
        onClick={() => onChoose(plan)}
        className={cn('mt-5 h-10 rounded-lg text-sm font-semibold text-white transition disabled:bg-slate-200 disabled:text-slate-500', t.button)}
      >
        {current ? 'Plan actuel' : cta}
      </button>
    </article>
  );
}
