'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2, Phone } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { formatAmount } from '@/utilis/format';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { accountService } from '@/services/account.service';
import { subscriptionService } from '@/services/subscription.service';
import type { ContactUnlock, PaymentRecord, PaymentStatus, Subscription } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { Pill, type PillTone } from '@/components/ui/Pill';

const STATUS: Record<PaymentStatus, [string, PillTone]> = {
  paid: ['Payé', 'trust'],
  pending: ['En attente', 'caution-soft'],
  failed: ['Échec', 'danger-soft'],
  expired: ['Expiré', 'neutral-soft'],
  cancelled: ['Annulé', 'neutral-soft'],
};
const OPERATOR = { mtn_momo: 'MTN MoMo', orange_money: 'Orange Money' } as const;
const AUDIENCE = { owner_agent: 'Propriétaire / Agent', candidate: 'Candidat', recruiter: 'Recruteur' } as const;

/** Paiements (M15) : historique, reçus, déblocages contact, abonnements en cours. */
export default function PaymentsPage() {
  const { ready } = useRequireAuth();
  const [payments, setPayments] = useState<PaymentRecord[] | null>(null);
  const [unlocks, setUnlocks] = useState<ContactUnlock[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);

  useEffect(() => {
    if (!ready) return;
    accountService.payments().then(setPayments).catch(() => setPayments([]));
    accountService.unlocks().then(setUnlocks).catch(() => undefined);
    subscriptionService.mine().then(setSubs).catch(() => undefined);
  }, [ready]);

  const total = payments?.filter((p) => p.status === 'paid').reduce((n, p) => n + p.amount, 0) ?? 0;

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <header className="mx-4 md:mx-0">
          <h1 className="text-xl font-bold text-navy">Paiements</h1>
          <p className="text-sm text-slate-500">Total payé : <strong className="text-navy">{formatAmount(total)}</strong></p>
        </header>

        <section aria-labelledby="subs-title" className="mx-4 md:mx-0 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 id="subs-title" className="font-semibold text-navy mb-2">Abonnements en cours</h2>
          {subs.length === 0 ? <p className="text-sm text-slate-500">Aucun abonnement actif.</p> : (
            <ul className="divide-y divide-slate-100">
              {subs.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-navy font-medium">{s.planName} <span className="text-xs font-normal text-slate-500">· {AUDIENCE[s.audience]}</span></span>
                  <span className="text-xs text-slate-500">jusqu&apos;au {new Date(s.expiresAt).toLocaleDateString('fr-FR')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="unlocks-title" className="mx-4 md:mx-0 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 id="unlocks-title" className="font-semibold text-navy mb-2">Contacts débloqués</h2>
          {unlocks.length === 0 ? <p className="text-sm text-slate-500">Aucun contact débloqué.</p> : (
            <ul className="divide-y divide-slate-100">
              {unlocks.map((u) => (
                <li key={u.listingId} className="flex items-center gap-3 py-2 text-sm">
                  <Phone className="w-4 h-4 text-trust shrink-0" />
                  <Link href={URL.v2.listing(u.listingId)} className="flex-1 min-w-0 truncate text-navy hover:underline">{u.title}</Link>
                  <span className="text-xs text-slate-500 shrink-0">{u.publisherName} · {new Date(u.unlockedAt).toLocaleDateString('fr-FR')}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-slate-400">Le numéro reste accessible depuis la fiche de l&apos;annonce.</p>
        </section>

        <section aria-labelledby="history-title" className="mx-4 md:mx-0 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 id="history-title" className="font-semibold text-navy mb-2">Historique</h2>
          {payments === null ? <Loader2 className="mx-auto w-5 h-5 animate-spin text-brand" /> : payments.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun paiement pour le moment.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {payments.map((p) => {
                const [label, tone] = STATUS[p.status];
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-navy truncate">{p.label}</p>
                      <p className="text-xs text-slate-500">{new Date(p.paidAt ?? p.createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })} · {OPERATOR[p.operator]}</p>
                    </div>
                    <span className="font-semibold text-navy">{formatAmount(p.amount)}</span>
                    <Pill tone={tone}>{label}</Pill>
                    {p.receiptNumber && (
                      <Link href={URL.v2.receipt(p.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"><FileText className="w-3.5 h-3.5" /> Reçu</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </ShellColumns>
  );
}
