'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { formatAmount, formatShortStamp } from '@/utilis/format';
import { adminService } from '@/services/admin.service';
import type { AdminSettings, AdminStats, QueueItem } from '@/types';
import { Pill, type PillTone } from '@/components/ui/Pill';
import { AdminCard, AdminGate, AdminHeader, EmptyRow, useAdminGuard } from '@/components/admin/AdminParts';

const QUEUE_HREF: Record<QueueItem['kind'], string> = {
  kyc: URL.admin.kyc, listing: URL.admin.listings, review: URL.admin.reports, report: URL.admin.reports, payment: URL.admin.payments, proof: URL.admin.proofs,
};

export function queueStatus(q: QueueItem): [string, PillTone] {
  if (q.priority === 'high') return ['Priorité élevée', 'danger'];
  if (q.status === 'valide') return ['Validé', 'trust'];
  if (q.status === 'a_revoir') return ['À revoir', 'caution'];
  return ['À vérifier', 'caution'];
}

function Kpi({ label, value, tone, href }: { label: string; value: string; tone: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </>
  );
  const cls = 'rounded-2xl border border-slate-200 bg-white p-4 block';
  return href ? <Link href={href} className={`${cls} hover:border-brand`}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** Module 16 — Tableau de bord back-office. */
export default function AdminDashboardPage() {
  const guard = useAdminGuard();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    if (!guard.allowed) return;
    adminService.stats().then(setStats).catch(() => undefined);
    adminService.queue().then(setQueue).catch(() => setQueue([]));
    if (guard.can('manage_settings')) adminService.settings().then(setSettings).catch(() => undefined);
  }, [guard.allowed]); // eslint-disable-line react-hooks/exhaustive-deps

  const planPrice = (code: string) => settings?.plans.find((p) => p.code === code)?.price;

  return (
    <AdminGate guard={guard}>
      <AdminHeader title="Tableau de bord" subtitle="Rendre les règles business et la confiance administrables sans redéploiement." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Kpi label="Utilisateurs" value={stats ? stats.users.toLocaleString('fr-FR') : '…'} tone="text-brand" href={guard.can('manage_users') ? URL.admin.users : undefined} />
        <Kpi label="Vérifications" value={stats ? String(stats.pendingKyc + stats.pendingProofs) : '…'} tone="text-caution" href={guard.can('review_kyc') ? URL.admin.kyc : undefined} />
        <Kpi label="Paiements du jour" value={stats ? formatAmount(stats.paymentsToday).replace('FCFA', 'F') : '…'} tone="text-trust" href={guard.can('view_payments') ? URL.admin.payments : undefined} />
        <Kpi label="Signalements" value={stats ? String(stats.openReports) : '…'} tone="text-red-600" href={guard.can('handle_reports') ? URL.admin.reports : undefined} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <AdminCard title="File de modération">
          {queue === null ? <EmptyRow>Chargement…</EmptyRow> : queue.length === 0 ? <EmptyRow>Rien à modérer. 🎉</EmptyRow> : (
            <ul className="divide-y divide-slate-100">
              {queue.slice(0, 10).map((q) => {
                const [label, tone] = queueStatus(q);
                return (
                  <li key={q.id}>
                    <Link href={QUEUE_HREF[q.kind]} className="flex items-center gap-3 py-2.5 hover:bg-surface -mx-2 px-2 rounded-lg">
                      <span className="w-16 sm:w-24 shrink-0 text-[11px] sm:text-xs font-semibold text-navy">{q.ref}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-navy">{q.title}</span>
                        <span className="block truncate text-xs text-slate-500">{q.subtitle} · {formatShortStamp(q.createdAt)}</span>
                      </span>
                      <Pill tone={tone}>{label}</Pill>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>

        {settings && (
          <AdminCard title="Paramètres produit" actions={<Link href={URL.admin.settings} className="text-xs font-semibold text-brand hover:underline">Modifier</Link>}>
            <dl className="divide-y divide-slate-100 text-sm">
              {([
                ['Déblocage contact', settings.contactUnlock.price],
                ['Plan Vérifié', planPrice('oa_verifie')],
                ['Plan Pro', planPrice('oa_pro')],
                ['Plan Premium', planPrice('oa_premium')],
                ['Candidat Standard', planPrice('cand_standard')],
                ['Candidat Premium', planPrice('cand_premium')],
                ['Recruteur Essentiel', planPrice('rec_essentiel')],
              ] as [string, number | undefined][]).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2"><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-navy">{v !== undefined ? formatAmount(v).replace('FCFA', 'F') : '—'}</dd></div>
              ))}
            </dl>
          </AdminCard>
        )}
      </div>
    </AdminGate>
  );
}
