'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, FileText, MapPin } from 'lucide-react';

import { cn } from '@/utilis/utils';
import { formatClock, formatDayLabel, formatShortStamp } from '@/utilis/format';
import { KYC_STATUS_LABEL } from '@/lib/kycRequirements';
import { adminService } from '@/services/admin.service';
import type { AdminKycDossier, AdminKycSummary, DocumentView, KycDecision, KycStatus } from '@/types';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { AdminCard, AdminGate, AdminHeader, DecisionDialog, EmptyRow, TabBar, useAdminGuard } from '@/components/admin/AdminParts';
import { KycStatusPill } from '@/views/certification/CertificationPage';

const DOC = { identity: "Carte d'identité", property_proof: 'Preuve liée au bien', professional_card: 'Carte professionnelle', mandate: 'Mandat' } as const;

/** Vérifications KYC : dossiers soumis, consultation sécurisée des pièces, décision motivée. */
export default function AdminKycPage() {
  const guard = useAdminGuard(['review_kyc']);
  const [tab, setTab] = useState<KycStatus>('soumis');
  const [list, setList] = useState<AdminKycSummary[] | null>(null);
  const [selected, setSelected] = useState<AdminKycDossier | null>(null);
  const [view, setView] = useState<{ doc: string; v: DocumentView } | null>(null);
  const [decision, setDecision] = useState<KycDecision | null>(null);
  const [rejectedDocs, setRejectedDocs] = useState<string[]>([]);
  const { show: showToast, node: toastNode } = useToast();

  const load = useCallback(() => { adminService.kycList(tab).then(setList).catch(() => setList([])); }, [tab]);
  useEffect(() => { if (guard.allowed) load(); }, [guard.allowed, load]);

  const open = async (userId: string) => { setSelected(await adminService.kycDossier(userId)); setRejectedDocs([]); };

  const decide = async (d: KycDecision, reason?: string) => {
    if (!selected) return;
    const next = await adminService.kycDecision(guard.actor, selected.userId, d, reason, d === 'reject' ? rejectedDocs : undefined);
    setSelected(next);
    showToast(d === 'approve' ? 'Dossier validé : badge activé' : d === 'reject' ? 'Dossier rejeté, motif envoyé' : 'Dossier pris en charge');
    load();
  };

  const consult = async (docId: string, name: string) => {
    if (!selected) return;
    try { setView({ doc: name, v: await adminService.viewDocument(guard.actor, selected.userId, docId) }); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Pièce indisponible'); }
  };

  return (
    <AdminGate guard={guard}>
      <AdminHeader title="Vérifications" subtitle="Les pièces ne sont consultables qu'ici, via un lien temporaire ; chaque consultation est journalisée." />
      <TabBar<KycStatus> label="Statut des dossiers" value={tab} onChange={(t) => { setTab(t); setSelected(null); }}
        tabs={[{ value: 'soumis', label: 'Soumis' }, { value: 'en_revue', label: 'En revue' }, { value: 'verifie', label: 'Vérifiés' }, { value: 'rejete', label: 'Rejetés' }]} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <AdminCard>
          {list === null ? <EmptyRow>Chargement…</EmptyRow> : list.length === 0 ? <EmptyRow>Aucun dossier.</EmptyRow> : (
            <ul className="flex flex-col gap-1">
              {list.map((d) => (
                <li key={d.userId}>
                  <button type="button" onClick={() => open(d.userId)} className={cn('w-full text-left rounded-lg px-3 py-2', selected?.userId === d.userId ? 'bg-brand-50' : 'hover:bg-surface')}>
                    <span className="block text-sm font-semibold text-navy">{d.userName}</span>
                    <span className="block text-xs text-slate-500">{d.profile === 'agent' ? 'Agent' : 'Propriétaire'} · {d.documentsCount} pièces · {d.submittedAt ? formatShortStamp(d.submittedAt) : '—'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        {selected ? (
          <AdminCard>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-bold text-navy">{selected.userName}</h2>
                <p className="text-xs text-slate-500">{selected.userEmail} · {selected.profile === 'agent' ? 'Agent immobilier' : 'Propriétaire / bailleur'}</p>
              </div>
              <KycStatusPill status={selected.status} />
            </div>

            <h3 className="text-sm font-semibold text-navy mb-2">Pièces</h3>
            <ul className="flex flex-col gap-2 mb-4">
              {selected.documents.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="flex-1 min-w-[160px]">{DOC[d.type]}{d.side && ` (${d.side})`} <span className="text-xs text-slate-400">· {d.fileName}</span></span>
                  {d.status === 'rejected' && <Pill tone="danger-soft">Refusée</Pill>}
                  {d.status === 'accepted' && <Pill tone="trust-soft">Acceptée</Pill>}
                  <button type="button" onClick={() => consult(d.id, d.fileName)} className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg border border-slate-200 text-xs font-semibold text-navy"><Eye className="w-3.5 h-3.5" /> Consulter</button>
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-semibold text-navy mb-2">Biens / lieux déclarés</h3>
            <ul className="flex flex-wrap gap-2 mb-4">
              {selected.locations.map((l, i) => (
                <li key={i} className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs text-navy">
                  <MapPin className="w-3.5 h-3.5 text-trust" /> {l.district}, {l.city}{l.latitude !== undefined && ` · ${l.latitude}, ${l.longitude}`}
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-semibold text-navy mb-2">Historique de contrôle</h3>
            <ol className="mb-5 flex flex-col gap-1 border-l-2 border-slate-100 pl-3 text-xs">
              {[...selected.history].reverse().map((h, i) => (
                <li key={i}><strong className="text-navy">{KYC_STATUS_LABEL[h.status]}</strong> <span className="text-slate-400">· {formatDayLabel(h.at)} {formatClock(h.at)}</span>{h.note && <span className="block text-slate-500">{h.note}</span>}</li>
              ))}
            </ol>

            <div className="flex flex-wrap gap-2">
              {selected.status === 'soumis' && <button type="button" onClick={() => decide('start_review')} className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-navy">Prendre en charge</button>}
              {(selected.status === 'soumis' || selected.status === 'en_revue') && (
                <>
                  <button type="button" onClick={() => setDecision('approve')} className="h-9 px-4 rounded-lg bg-trust text-white text-sm font-semibold">Valider</button>
                  <button type="button" onClick={() => setDecision('reject')} className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold">Rejeter</button>
                </>
              )}
            </div>
          </AdminCard>
        ) : (
          <AdminCard><EmptyRow>Sélectionnez un dossier.</EmptyRow></AdminCard>
        )}
      </div>

      {selected && decision && (
        <DecisionDialog
          open={!!decision}
          onOpenChange={(o) => { if (!o) setDecision(null); }}
          title={decision === 'approve' ? 'Valider la certification' : 'Rejeter le dossier'}
          description={selected.userName}
          initial={decision}
          options={decision === 'approve' ? [{ value: 'approve', label: 'Identité et justificatifs conformes' }] : [{ value: 'reject', label: 'Rejeter (motif communiqué à l’utilisateur)', negative: true }]}
          onConfirm={decide}
          extra={decision === 'reject' && (
            <fieldset className="flex flex-col gap-1 text-sm">
              <legend className="text-xs font-medium text-slate-500 mb-1">Pièces à refaire</legend>
              {selected.documents.map((d) => (
                <label key={d.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={rejectedDocs.includes(d.id)} onChange={(e) => setRejectedDocs((prev) => (e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id)))} />
                  {DOC[d.type]}{d.side && ` (${d.side})`}
                </label>
              ))}
            </fieldset>
          )}
        />
      )}

      <Modal open={!!view} onOpenChange={(o) => { if (!o) setView(null); }} title={view?.doc ?? ''} description={view ? `Lien temporaire — expire à ${formatClock(view.v.expiresAt)}. Consultation journalisée.` : undefined}>
        {view && <img src={view.v.url} alt={`Pièce ${view.doc}`} className="w-full rounded-lg select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} />}
      </Modal>
      {toastNode}
    </AdminGate>
  );
}
