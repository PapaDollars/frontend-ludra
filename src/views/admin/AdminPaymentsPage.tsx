'use client';

import { useCallback, useEffect, useState } from 'react';

import { formatAmount } from '@/utilis/format';
import { adminService } from '@/services/admin.service';
import type { AdminPayment, PaymentStatus } from '@/types';
import { Pill, type PillTone } from '@/components/ui/Pill';
import { SelectInput } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { AdminCard, AdminGate, AdminHeader, EmptyRow, useAdminGuard } from '@/components/admin/AdminParts';

const STATUS: Record<PaymentStatus, [string, PillTone]> = {
  paid: ['Payé', 'trust'], pending: ['En attente', 'caution'], failed: ['Échec', 'danger-soft'], expired: ['Expiré', 'neutral-soft'], cancelled: ['Annulé', 'neutral-soft'],
};
const WEBHOOK: Record<AdminPayment['webhook'], [string, PillTone]> = {
  received: ['Webhook reçu', 'trust-soft'], missing: ['Webhook manquant', 'caution'], invalid_signature: ['Signature invalide', 'danger'],
};
const OPERATOR = { mtn_momo: 'MTN', orange_money: 'Orange' } as const;

/** Paiements : suivi, anomalies de webhook, rapprochement opérateur. */
export default function AdminPaymentsPage() {
  const guard = useAdminGuard(['view_payments', 'manage_payments']);
  const [status, setStatus] = useState('');
  const [purpose, setPurpose] = useState('');
  const [rows, setRows] = useState<AdminPayment[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { show: showToast, node: toastNode } = useToast();

  const load = useCallback(() => {
    adminService.payments({ status: status || undefined, purpose: purpose || undefined }).then(setRows).catch(() => setRows([]));
  }, [status, purpose]);
  useEffect(() => { if (guard.allowed) load(); }, [guard.allowed, load]);

  const reconcile = async (p: AdminPayment) => {
    setBusy(p.id);
    try { await adminService.reconcile(guard.actor, p.id); showToast('Paiement confirmé auprès de l’opérateur'); load(); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Rapprochement impossible'); }
    finally { setBusy(null); }
  };

  const total = rows?.filter((p) => p.status === 'paid').reduce((n, p) => n + p.amount, 0) ?? 0;

  return (
    <AdminGate guard={guard}>
      <AdminHeader title="Paiements" subtitle="Un droit n'est accordé qu'au webhook « paid » vérifié. Les anomalies se rapprochent ici." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="pay-status">Statut</label>
        <SelectInput id="pay-status" value={status} onChange={(e) => setStatus(e.target.value)} className="!w-auto h-9">
          <option value="">Tous statuts</option>
          {Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
        </SelectInput>
        <label className="sr-only" htmlFor="pay-purpose">Objet</label>
        <SelectInput id="pay-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="!w-auto h-9">
          <option value="">Tous objets</option>
          <option value="unlock_contact">Déblocage contact</option>
          <option value="subscription">Abonnements</option>
        </SelectInput>
        <p className="ml-auto text-sm text-slate-500">Total payé (filtre) : <strong className="text-navy">{formatAmount(total)}</strong></p>
      </div>

      <AdminCard>
        {rows === null ? <EmptyRow>Chargement…</EmptyRow> : rows.length === 0 ? <EmptyRow>Aucun paiement.</EmptyRow> : (
          <ul className="divide-y divide-slate-100">
            {rows.map((p) => {
              const [sl, st] = STATUS[p.status];
              const [wl, wt] = WEBHOOK[p.webhook];
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                  <div className="min-w-[220px] flex-1">
                    <p className="font-medium text-navy truncate">{p.label}</p>
                    <p className="text-xs text-slate-500">{p.userName} · {OPERATOR[p.operator]} · {new Date(p.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · réf. {p.operatorReference ?? p.id}</p>
                    {p.failureReason && <p className="text-xs text-red-600">{p.failureReason}</p>}
                  </div>
                  <span className="font-semibold text-navy w-24 text-right">{formatAmount(p.amount)}</span>
                  <Pill tone={st}>{sl}</Pill>
                  <Pill tone={wt}>{wl}</Pill>
                  {p.status === 'pending' && guard.can('manage_payments') && (
                    <button type="button" disabled={busy === p.id} onClick={() => reconcile(p)} className="h-8 px-3 rounded-lg bg-brand text-white text-xs font-semibold disabled:opacity-60">
                      {busy === p.id ? '…' : 'Rapprocher'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
      {toastNode}
    </AdminGate>
  );
}
