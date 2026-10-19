'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ShieldOff } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { hasPermission, isAdminRole } from '@/lib/adminPermissions';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import type { AdminPermission } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Field, TextArea } from '@/components/ui/Form';

export interface AdminActor { id: string; name: string; role: string }

/**
 * Garde back-office : connexion + rôle admin + permission(s).
 * Le front masque ; le serveur refuse (403) — RBAC §6.1.
 */
export function useAdminGuard(perms: AdminPermission[] = []) {
  const { ready, user, isLoading } = useRequireAuth();
  const isAdmin = isAdminRole(user);
  const allowed = isAdmin && (perms.length === 0 || perms.some((p) => hasPermission(user, p)));
  const actor: AdminActor = { id: user?.id ?? '', name: user?.name ?? 'Admin', role: user?.role ?? '' };
  const can = (p: AdminPermission) => hasPermission(user, p);
  return { ready: ready && !isLoading, allowed, actor, can };
}

export function AdminGate({ guard, children }: { guard: ReturnType<typeof useAdminGuard>; children: ReactNode }) {
  if (!guard.ready) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  if (!guard.allowed) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <ShieldOff className="mx-auto mb-3 w-10 h-10 text-slate-300" />
        <h1 className="font-bold text-navy mb-1">Accès refusé</h1>
        <p className="text-sm text-slate-500 mb-4">Cette section est réservée aux administrateurs disposant de la permission correspondante.</p>
        <Link href={URL.v2.feed} className="text-sm font-semibold text-brand underline">Retour au site</Link>
      </div>
    );
  }
  return <>{children}</>;
}

export function AdminHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-navy">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}

export function AdminCard({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn('min-w-0 rounded-2xl border border-slate-200 bg-white p-4 lg:p-5', className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="font-semibold text-navy">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function TabBar<T extends string>({ tabs, value, onChange, label }: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="mb-4 flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-200">
      {tabs.map((t) => (
        <button key={t.value} role="tab" type="button" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn('shrink-0 px-3 py-2 text-sm border-b-2 -mb-px', value === t.value ? 'border-brand text-brand font-semibold' : 'border-transparent text-slate-500 hover:text-navy')}>
          {t.label}{t.count !== undefined && <span className="ml-1 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-600">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export interface DecisionOption<D extends string> {
  value: D;
  label: string;
  /** Décision négative : motif obligatoire. */
  negative?: boolean;
}

interface DecisionDialogProps<D extends string> {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  options: DecisionOption<D>[];
  initial?: D;
  onConfirm: (decision: D, reason?: string) => Promise<void>;
  extra?: ReactNode;
}

/** Décision de modération : choix + motif (obligatoire si négative) — journalisée côté serveur. */
export function DecisionDialog<D extends string>({ open, onOpenChange, title, description, options, initial, onConfirm, extra }: DecisionDialogProps<D>) {
  const [decision, setDecision] = useState<D>(initial ?? options[0].value);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setDecision(initial ?? options[0].value); setReason(''); setError(null); } }, [open, initial, options]);

  const negative = options.find((o) => o.value === decision)?.negative;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (negative && reason.trim().length < 5) return setError('Motif obligatoire (5 caractères minimum) : il est communiqué à l’utilisateur et journalisé.');
    setBusy(true);
    setError(null);
    try { await onConfirm(decision, reason.trim() || undefined); onOpenChange(false); }
    catch (err) { setError(err instanceof Error ? err.message : 'Décision impossible.'); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description}
      footer={<button form="decision-form" type="submit" disabled={busy} className={cn('w-full h-11 rounded-lg text-white text-sm font-semibold disabled:opacity-60', negative ? 'bg-red-600' : 'bg-brand')}>{busy ? 'Enregistrement…' : 'Confirmer la décision'}</button>}>
      <form id="decision-form" onSubmit={submit} className="flex flex-col gap-3">
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Décision</legend>
          {options.map((o) => (
            <label key={o.value} className={cn('flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm cursor-pointer', decision === o.value ? (o.negative ? 'border-red-400 bg-red-50 text-red-700' : 'border-brand bg-brand-50 text-brand-700') : 'border-slate-200 text-navy')}>
              <input type="radio" name="decision" value={o.value} checked={decision === o.value} onChange={() => setDecision(o.value)} />
              {o.label}
            </label>
          ))}
        </fieldset>
        {extra}
        <Field label={negative ? 'Motif (obligatoire)' : 'Note interne (facultative)'} htmlFor="decision-reason" hint="Journalisé avec votre nom et la date.">
          <TextArea id="decision-reason" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} className="min-h-[80px]" />
        </Field>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

export const EmptyRow = ({ children }: { children: ReactNode }) => <p className="py-8 text-center text-sm text-slate-500">{children}</p>;
