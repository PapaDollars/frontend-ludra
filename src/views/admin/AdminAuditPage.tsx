'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { adminService } from '@/services/admin.service';
import type { AuditEntry } from '@/types';
import { SelectInput } from '@/components/ui/Form';
import { AdminCard, AdminGate, AdminHeader, EmptyRow, useAdminGuard } from '@/components/admin/AdminParts';

const DOMAINS = [
  ['', 'Toutes les actions'], ['kyc', 'Vérifications'], ['document', 'Consultation de pièces'], ['listing', 'Annonces'], ['review', 'Avis'],
  ['report', 'Signalements'], ['payment', 'Paiements'], ['proof', 'Preuves'], ['settings', 'Paramètres'], ['user', 'Utilisateurs'],
] as const;

const ACTION_LABEL: Record<string, string> = {
  'kyc.start_review': 'Dossier KYC pris en charge', 'kyc.approve': 'KYC validé', 'kyc.reject': 'KYC rejeté', 'document.view': 'Pièce consultée',
  'listing.approve': 'Annonce approuvée', 'listing.reject': 'Annonce rejetée', 'listing.suspend': 'Annonce suspendue', 'listing.restore': 'Annonce rétablie',
  'listing.sponsor': 'Mise en avant activée', 'listing.unsponsor': 'Mise en avant retirée', 'review.keep': 'Avis conservé', 'review.remove': 'Avis retiré',
  'report.dismiss': 'Signalement classé', 'report.warn_user': 'Utilisateur averti', 'report.remove_content': 'Contenu retiré', 'report.suspend_user': 'Compte suspendu (signalement)',
  'payment.reconcile': 'Paiement rapproché', 'proof.approve': 'Preuve validée', 'proof.reject': 'Preuve refusée', 'settings.update': 'Paramètres modifiés',
  'user.update': 'Utilisateur modifié', 'user.suspend': 'Utilisateur suspendu', 'user.restore': 'Utilisateur réactivé',
};

/** Journal d'audit : toute décision admin (qui, quoi, quand, motif, changements). Lecture seule. */
export default function AdminAuditPage() {
  const guard = useAdminGuard(['view_audit']);
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);

  const load = useCallback(async (from: string | null) => {
    const page = await adminService.audit({ q: q || undefined, action: action || undefined, cursor: from });
    setRows((prev) => (from ? [...(prev ?? []), ...page.items] : page.items));
    setCursor(page.nextCursor);
  }, [q, action]);
  useEffect(() => { if (guard.allowed) { const t = setTimeout(() => load(null), 200); return () => clearTimeout(t); } }, [guard.allowed, load]);

  return (
    <AdminGate guard={guard}>
      <AdminHeader title="Journal d'audit" subtitle="Entrées non modifiables, conservées selon la politique de rétention." />
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative flex-1 min-w-[220px] max-w-sm">
          <span className="sr-only">Rechercher</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Admin, cible, motif…" className="w-full h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand" />
        </label>
        <label htmlFor="audit-action" className="sr-only">Type d&apos;action</label>
        <SelectInput id="audit-action" value={action} onChange={(e) => setAction(e.target.value)} className="!w-auto h-10">
          {DOMAINS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </SelectInput>
      </div>
      <AdminCard>
        {rows === null ? <EmptyRow>Chargement…</EmptyRow> : rows.length === 0 ? <EmptyRow>Aucune entrée.</EmptyRow> : (
          <ol className="divide-y divide-slate-100">
            {rows.map((a) => (
              <li key={a.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <time dateTime={a.at} className="w-36 shrink-0 text-xs text-slate-400">{new Date(a.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })}</time>
                  <span className="font-semibold text-navy">{ACTION_LABEL[a.action] ?? a.action}</span>
                  <span className="text-slate-600">— {a.targetLabel}</span>
                </div>
                <p className="text-xs text-slate-500 sm:ml-[9.5rem]">
                  par {a.actor.name} ({a.actor.role === 'proprietaire' ? 'compte principal' : 'admin'}){a.reason && <> · motif : « {a.reason} »</>}
                </p>
                {a.changes && (
                  <ul className="mt-1 sm:ml-[9.5rem] flex flex-col gap-0.5 text-xs text-slate-500">
                    {a.changes.map((c, i) => <li key={i}>{c.field} : <span className="line-through">{c.from}</span> → <strong className="text-navy">{c.to}</strong></li>)}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
        {cursor && <button type="button" onClick={() => load(cursor)} className="mt-3 h-9 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-navy">Plus d&apos;entrées</button>}
      </AdminCard>
    </AdminGate>
  );
}
