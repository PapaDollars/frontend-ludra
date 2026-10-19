'use client';

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, forwardRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/utilis/utils';
import { TextInput } from '@/components/ui/Form';

/** Carte des écrans d'authentification (mêmes bordures / rayons que les cartes V2.1). */
export function AuthCard({ title, subtitle, children, footer }: {
  title?: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <div className="w-full max-w-md">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-8">
        {title && (
          <header className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-navy">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </header>
        )}
        {children}
      </section>
      {footer && <div className="mt-4 text-center text-sm text-slate-600">{footer}</div>}
    </div>
  );
}

/** Champ texte V2.1 avec icône à gauche. */
export const IconInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }>(
  ({ icon: Icon, className, ...props }, ref) => (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
      <TextInput ref={ref} className={cn('h-11 pl-9', className)} {...props} />
    </div>
  ),
);
IconInput.displayName = 'IconInput';

/** Mot de passe avec bouton afficher / masquer. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { icon: LucideIcon }>(
  ({ icon: Icon, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
        <TextInput ref={ref} type={visible ? 'text' : 'password'} className={cn('h-11 pl-9 pr-10', className)} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-navy"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

/** Message d'erreur ou de succès en tête de formulaire. */
export function AuthAlert({ tone = 'error', children }: { tone?: 'error' | 'success'; children: ReactNode }) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm', tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-trust-50 text-green-800')}
    >
      <Icon className="mt-0.5 w-4 h-4 shrink-0" aria-hidden="true" /> {children}
    </p>
  );
}

const BUTTON = {
  primary: 'bg-brand text-white hover:bg-brand-700',
  outline: 'border border-slate-200 bg-white text-navy hover:bg-slate-50',
} as const;

/** Bouton pleine largeur des écrans d'authentification. */
export function AuthButton({ loading, variant = 'primary', className, children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean; variant?: keyof typeof BUTTON;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={cn('w-full h-11 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed', BUTTON[variant], className)}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Écran d'état (succès, lien invalide…) dans une carte. */
export function AuthStatus({ tone, title, children, action }: {
  tone: 'success' | 'error'; title: string; children: ReactNode; action?: ReactNode;
}) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div className="text-center">
      <span className={cn('mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center', tone === 'success' ? 'bg-trust-50 text-trust' : 'bg-red-50 text-red-600')}>
        <Icon className="w-7 h-7" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-bold text-navy">{title}</h1>
      <div className="mt-2 text-sm text-slate-500 leading-relaxed">{children}</div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
