'use client';

import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utilis/utils';

const CONTROL = 'w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100';

export function Field({ label, htmlFor, children, className, error, hint, required }: {
  label: string; htmlFor?: string; children: ReactNode; className?: string;
  /** Message d'erreur affiché sous le champ (id = `${htmlFor}-error` pour aria-describedby). */
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-slate-500">
        {label}{required && <span className="text-red-500" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

/** Attributs a11y d'un champ en erreur. */
export const errorProps = (id: string, error?: string) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-error` : undefined,
});

/** Groupe de puces/boutons sous un intitulé (rôle group pour les lecteurs d'écran). */
export function FieldGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(CONTROL, className)} {...props} />,
);
TextInput.displayName = 'TextInput';

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { showCount?: boolean }>(
  ({ className, showCount, maxLength, value, ...props }, ref) => (
    <div className="relative">
      <textarea
        ref={ref}
        maxLength={maxLength}
        value={value}
        className={cn(CONTROL, 'h-auto min-h-[110px] py-2 leading-relaxed', showCount && maxLength && 'pb-6', className)}
        {...props}
      />
      {showCount && maxLength && (
        <span className="absolute bottom-2 right-3 text-[10px] text-slate-400" aria-hidden="true">
          {String(value ?? '').length} / {maxLength}
        </span>
      )}
    </div>
  ),
);
TextArea.displayName = 'TextArea';

export function SelectInput({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, 'pr-8', className)} {...props}>{children}</select>;
}

/** Champ numérique : renvoie `undefined` quand il est vidé. */
export function NumberInput({ value, onValueChange, className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | undefined;
  onValueChange: (v: number | undefined) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      value={value ?? ''}
      onChange={(e) => {
        const n = e.target.valueAsNumber;
        onValueChange(Number.isFinite(n) && n >= 0 ? n : undefined);
      }}
      className={cn(CONTROL, className)}
      {...props}
    />
  );
}

const CHIP_ACTIVE = {
  brand: 'bg-brand text-white border-brand',
  trust: 'bg-trust text-white border-trust',
} as const;

export function ToggleChip({ active, onClick, children, tone = 'brand' }: {
  active: boolean; onClick: () => void; children: ReactNode; tone?: keyof typeof CHIP_ACTIVE;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-9 px-4 rounded-full border text-sm font-medium transition-colors',
        active ? CHIP_ACTIVE[tone] : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300',
      )}
    >
      {children}
    </button>
  );
}
