'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

import { cn } from '@/utilis/utils';
import { formatAmount } from '@/utilis/format';
import type { MobileMoneyOperator } from '@/types';
import type { MobileMoneyPayment } from '@/hooks/useMobileMoneyPayment';
import { Modal } from '@/components/ui/Modal';
import { Field, TextInput } from '@/components/ui/Form';

const OPERATORS: { value: MobileMoneyOperator; label: string; code: string; className: string }[] = [
  { value: 'mtn_momo', label: 'MTN Mobile Money', code: 'MTN', className: 'bg-yellow-400 text-navy' },
  { value: 'orange_money', label: 'Orange Money', code: 'OM', className: 'bg-orange-500 text-white' },
];

/** Normalise un numéro camerounais en 6XXXXXXXX ; null si invalide. */
export function normalizeCmPhone(input: string): string | null {
  const d = input.replace(/\D/g, '').replace(/^237/, '');
  return /^6\d{8}$/.test(d) ? d : null;
}

interface MobileMoneyCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: MobileMoneyPayment;
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Ligne récapitulative, ex. "Accès contact pour cette annonce". */
  itemLabel: string;
  amount: number;
  /** Suffixe du montant, ex. " / mois". */
  amountSuffix?: string;
  defaultPhone?: string;
  footnote?: string;
  /** Contenu affiché une fois payé (contact révélé, abonnement actif…). */
  paidContent: ReactNode;
  paidTitle: string;
}

/** Fenêtre de paiement Mobile Money (bottom sheet sur mobile). Réutilisée par M04, M08, M12, M13. */
export function MobileMoneyCheckout({
  open, onOpenChange, payment, title, description, icon, itemLabel, amount, amountSuffix = '',
  defaultPhone, footnote, paidContent, paidTitle,
}: MobileMoneyCheckoutProps) {
  const { phase, error } = payment;
  const [operator, setOperator] = useState<MobileMoneyOperator>('mtn_momo');
  const [phone, setPhone] = useState(defaultPhone ?? '');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => { if (defaultPhone) setPhone((p) => p || defaultPhone); }, [defaultPhone]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeCmPhone(phone);
    if (!normalized) return setPhoneError('Numéro Mobile Money invalide (ex. 6 77 12 34 56).');
    setPhoneError(null);
    payment.start(operator, normalized);
  };

  const priceLabel = formatAmount(amount);
  const busy = phase === 'submitting';
  const primary = 'w-full h-11 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-600 disabled:opacity-60 inline-flex items-center justify-center gap-2';

  const footer = (() => {
    switch (phase) {
      case 'form':
      case 'submitting':
        return (
          <button form="momo-form" type="submit" disabled={busy} className={primary}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? 'Envoi de la demande…' : `Payer ${priceLabel}`}
          </button>
        );
      case 'timeout':
        return <button type="button" onClick={payment.resume} className={primary}>Vérifier à nouveau</button>;
      case 'failed':
        return <button type="button" onClick={payment.retry} className={primary}>Réessayer</button>;
      case 'paid':
        return <button type="button" onClick={() => onOpenChange(false)} className="w-full h-11 rounded-lg border border-slate-200 text-sm font-semibold text-navy">Fermer</button>;
      default:
        return null;
    }
  })();

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description} footer={footer}>
      {(phase === 'form' || phase === 'submitting') && (
        <form id="momo-form" onSubmit={submit} className="flex flex-col gap-4">
          {icon && <div className="mx-auto">{icon}</div>}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <span className="text-sm text-slate-600">{itemLabel}</span>
            <span className="font-bold text-brand">{priceLabel}{amountSuffix}</span>
          </div>

          <fieldset disabled={busy} className="flex flex-col gap-2">
            <legend className="text-xs font-medium text-slate-500 mb-1.5">Moyen de paiement</legend>
            <div className="grid grid-cols-2 gap-2">
              {OPERATORS.map((op) => (
                <label
                  key={op.value}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border p-3 cursor-pointer text-sm font-medium transition',
                    operator === op.value ? 'border-brand ring-2 ring-brand-100' : 'border-slate-200',
                  )}
                >
                  <input type="radio" name="operator" value={op.value} checked={operator === op.value} onChange={() => setOperator(op.value)} className="sr-only" />
                  <span className={cn('w-7 h-7 rounded-md text-[10px] font-bold flex items-center justify-center', op.className)} aria-hidden="true">{op.code}</span>
                  {op.label}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Numéro Mobile Money à débiter" htmlFor="momo-phone" error={phoneError ?? undefined}>
            <TextInput
              id="momo-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="6 77 12 34 56"
              value={phone}
              disabled={busy}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={phoneError ? true : undefined}
              aria-describedby={phoneError ? 'momo-phone-error' : undefined}
            />
          </Field>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {footnote && <p className="text-[11px] text-slate-400 text-center">{footnote}</p>}
        </form>
      )}

      {phase === 'pending' && (
        <div className="flex flex-col items-center text-center gap-3 py-4" role="status">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <p className="font-semibold text-navy">Validez le paiement sur votre téléphone</p>
          <p className="text-sm text-slate-500">
            Une demande de {priceLabel} vient d&apos;être envoyée. Confirmez-la avec votre code secret Mobile Money.
            Ne communiquez jamais ce code à personne.
          </p>
        </div>
      )}

      {phase === 'timeout' && (
        <div className="flex flex-col items-center text-center gap-3 py-4" role="status">
          <Loader2 className="w-10 h-10 text-slate-300" />
          <p className="font-semibold text-navy">Confirmation pas encore reçue</p>
          <p className="text-sm text-slate-500">
            Rien n&apos;est activé tant que l&apos;opérateur n&apos;a pas confirmé. Si vous avez validé, vérifiez à nouveau
            dans un instant : vous ne serez pas débité deux fois.
          </p>
        </div>
      )}

      {phase === 'failed' && (
        <div className="flex flex-col items-center text-center gap-3 py-4" role="alert">
          <XCircle className="w-10 h-10 text-red-500" />
          <p className="font-semibold text-navy">Paiement non abouti</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      )}

      {phase === 'paid' && (
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col items-center text-center gap-2">
            <CheckCircle2 className="w-10 h-10 text-trust" />
            <p className="font-semibold text-navy">{paidTitle}</p>
          </div>
          {error ? (
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <button type="button" onClick={payment.retryOnPaid} className="text-sm font-semibold text-brand underline">Réessayer</button>
            </div>
          ) : paidContent}
        </div>
      )}
    </Modal>
  );
}
