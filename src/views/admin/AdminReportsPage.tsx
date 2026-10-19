'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';

import { formatShortStamp } from '@/utilis/format';
import { adminService } from '@/services/admin.service';
import type { AdminReport, AdminReview, ReportDecision, ReportReason, ReviewDecision } from '@/types';
import { Pill } from '@/components/ui/Pill';
import { useToast } from '@/components/ui/Toast';
import { AdminCard, AdminGate, AdminHeader, DecisionDialog, EmptyRow, TabBar, useAdminGuard } from '@/components/admin/AdminParts';

const REASON: Record<ReportReason, string> = {
  arnaque: 'Arnaque / avance', fausse_annonce: 'Fausse annonce', doublon: 'Doublon / spam', contenu_inapproprie: 'Contenu inapproprié', deja_loue: 'Déjà loué', autre: 'Autre',
};
const TARGET = { listing: 'Annonce', user: 'Utilisateur', message: 'Message', review: 'Avis' } as const;

type Tab = 'reports' | 'reviews';

/** Signalements (annonces, utilisateurs, messages) et avis signalés. */
export default function AdminReportsPage() {
  const guard = useAdminGuard(['handle_reports', 'moderate_reviews']);
  const [tab, setTab] = useState<Tab>('reports');
  const [reports, setReports] = useState<AdminReport[] | null>(null);
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [report, setReport] = useState<AdminReport | null>(null);
  const [review, setReview] = useState<AdminReview | null>(null);
  const { show: showToast, node: toastNode } = useToast();

  useEffect(() => { if (guard.allowed && !guard.can('handle_reports')) setTab('reviews'); }, [guard.allowed]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    if (guard.can('handle_reports')) adminService.reports().then(setReports).catch(() => setReports([]));
    if (guard.can('moderate_reviews')) adminService.reviews().then(setReviews).catch(() => setReviews([]));
  }, [guard.allowed]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (guard.allowed) load(); }, [guard.allowed, load]);

  const tabs = [
    ...(guard.can('handle_reports') ? [{ value: 'reports' as Tab, label: 'Signalements', count: reports?.length }] : []),
    ...(guard.can('moderate_reviews') ? [{ value: 'reviews' as Tab, label: 'Avis signalés', count: reviews?.length }] : []),
  ];

  return (
    <AdminGate guard={guard}>
      <AdminHeader title="Avis & signalements" subtitle="Un avis ne peut être retiré que par la modération, avec motif et trace d'audit." />
      <TabBar<Tab> label="Files" value={tab} onChange={setTab} tabs={tabs} />

      {tab === 'reports' && (
        <AdminCard>
          {reports === null ? <EmptyRow>Chargement…</EmptyRow> : reports.length === 0 ? <EmptyRow>Aucun signalement ouvert.</EmptyRow> : (
            <ul className="divide-y divide-slate-100">
              {reports.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="neutral-soft">{TARGET[r.targetType]}</Pill>
                      <Pill tone={r.reason === 'arnaque' ? 'danger' : 'caution-soft'}>{REASON[r.reason]}</Pill>
                      {r.reportsOnTarget > 1 && <span className="text-xs font-semibold text-red-600">{r.reportsOnTarget} signalements sur cette cible</span>}
                    </div>
                    <p className="mt-1 text-sm font-medium text-navy">{r.targetLabel}</p>
                    {r.details && <p className="text-xs text-slate-600">« {r.details} »</p>}
                    <p className="text-xs text-slate-400">Par {r.reporterName} · {formatShortStamp(r.createdAt)}</p>
                  </div>
                  <button type="button" onClick={() => setReport(r)} className="h-8 px-3 rounded-lg bg-brand text-white text-xs font-semibold">Traiter</button>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      )}

      {tab === 'reviews' && (
        <AdminCard>
          {reviews === null ? <EmptyRow>Chargement…</EmptyRow> : reviews.length === 0 ? <EmptyRow>Aucun avis signalé.</EmptyRow> : (
            <ul className="divide-y divide-slate-100">
              {reviews.map((r) => (
                <li key={r.review.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-[220px] flex-1">
                    <p className="text-sm text-navy"><strong>{r.review.author.name}</strong> sur <strong>{r.subjectName}</strong>
                      <span className="ml-2 inline-flex text-amber-400" aria-label={`${r.review.rating} sur 5`}>{Array.from({ length: r.review.rating }, (_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}</span>
                    </p>
                    <p className="text-sm text-slate-600">« {r.review.comment} »</p>
                    <p className="text-xs text-slate-400">{r.reportsCount} signalement(s) : {r.reasons.map((x) => REASON[x]).join(', ')} · {formatShortStamp(r.review.createdAt)}</p>
                  </div>
                  <button type="button" onClick={() => setReview(r)} className="h-8 px-3 rounded-lg bg-brand text-white text-xs font-semibold">Décider</button>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      )}

      {report && (
        <DecisionDialog<ReportDecision>
          open onOpenChange={(o) => { if (!o) setReport(null); }}
          title={`Signalement — ${report.targetLabel}`}
          description={`${REASON[report.reason]} · ${TARGET[report.targetType]}`}
          options={[
            { value: 'dismiss', label: 'Classer sans suite' },
            { value: 'warn_user', label: 'Avertir l’utilisateur', negative: true },
            { value: 'remove_content', label: 'Retirer le contenu', negative: true },
            { value: 'suspend_user', label: 'Suspendre le compte', negative: true },
          ]}
          onConfirm={async (d, reason) => { await adminService.reportDecision(guard.actor, report.id, d, reason); showToast('Signalement traité et journalisé'); load(); }}
        />
      )}
      {review && (
        <DecisionDialog<ReviewDecision>
          open onOpenChange={(o) => { if (!o) setReview(null); }}
          title={`Avis de ${review.review.author.name}`}
          description={`Sur ${review.subjectName}`}
          options={[{ value: 'keep', label: 'Conserver l’avis (signalement non fondé)' }, { value: 'remove', label: 'Retirer l’avis', negative: true }]}
          onConfirm={async (d, reason) => { await adminService.reviewDecision(guard.actor, review.review.id, d, reason); showToast(d === 'remove' ? 'Avis retiré (audit enregistré)' : 'Avis conservé'); load(); }}
        />
      )}
      {toastNode}
    </AdminGate>
  );
}
