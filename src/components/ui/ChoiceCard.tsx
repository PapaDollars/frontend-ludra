import { ReactNode } from 'react';
import { cn } from '@/utilis/utils';

interface ChoiceCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  badge?: ReactNode;
  /** Pastille colorée (initiales de l'univers). */
  icon?: ReactNode;
  name: string;
  value: string;
}

/** Carte de choix unique (radio accessible). */
export function ChoiceCard({ selected, onSelect, title, description, badge, icon, name, value }: ChoiceCardProps) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition',
        selected ? 'border-brand bg-brand-50/50 ring-2 ring-brand-100' : 'border-slate-200 bg-white hover:border-slate-300',
      )}
    >
      <input type="radio" name={name} value={value} checked={selected} onChange={onSelect} className="sr-only" />
      <span className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-navy">{title}</span>
      </span>
      {description && <span className="text-xs text-slate-500">{description}</span>}
      {selected && badge}
    </label>
  );
}

export const UniverseDot = ({ code, className }: { code: string; className: string }) => (
  <span className={cn('w-7 h-7 rounded-full text-[10px] font-bold text-white flex items-center justify-center', className)} aria-hidden="true">{code}</span>
);
