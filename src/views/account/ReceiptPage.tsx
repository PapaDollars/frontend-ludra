'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { LogoImage } from '@/components/shell/Logo';
import { formatAmount } from '@/utilis/format';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { accountService } from '@/services/account.service';
import type { PaymentRecord } from '@/types';

const OPERATOR = { mtn_momo: 'MTN Mobile Money', orange_money: 'Orange Money' } as const;

/** Reçu imprimable (Ctrl+P / « Enregistrer en PDF » du navigateur). */
export default function ReceiptPage({ id }: { id: string }) {
  const { ready, user } = useRequireAuth();
  const [p, setP] = useState<PaymentRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready) accountService.payment(id).then(setP).catch((e) => setError(e instanceof Error ? e.message : 'Reçu introuvable.'));
  }, [ready, id]);

  if (error) return <p className="p-10 text-center text-sm text-red-600">{error}</p>;
  if (!p) return null;
  if (!p.receiptNumber) return <p className="p-10 text-center text-sm text-slate-500">Aucun reçu : ce paiement n&apos;a pas abouti.</p>;

  const rows: [string, string][] = [
    ['Reçu n°', p.receiptNumber],
    ['Date', new Date(p.paidAt ?? p.createdAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })],
    ['Client', user?.name ?? '—'],
    ['Objet', p.label],
    ['Moyen de paiement', OPERATOR[p.operator]],
    ['Référence transaction', p.id],
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-6 print:p-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={URL.v2.payments} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy"><ArrowLeft className="w-4 h-4" /> Paiements</Link>
        <button type="button" onClick={() => window.print()} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-brand text-white text-sm font-semibold"><Printer className="w-4 h-4" /> Imprimer / PDF</button>
      </div>
      <article className="rounded-2xl border border-slate-200 bg-white p-6 print:border-0">
        <header className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <LogoImage />
          <h1 className="text-lg font-bold text-navy">Reçu de paiement</h1>
        </header>
        <dl className="divide-y divide-slate-100 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-3 py-2"><dt className="w-40 shrink-0 text-slate-500">{k}</dt><dd className="flex-1 text-navy break-words">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-base font-bold text-navy">
          <span>Montant payé</span><span>{formatAmount(p.amount)}</span>
        </p>
        <p className="mt-6 text-[11px] text-slate-400">Paiement confirmé par l&apos;opérateur. Conservez ce reçu pour toute réclamation auprès du support LUDRA.</p>
      </article>
    </div>
  );
}
