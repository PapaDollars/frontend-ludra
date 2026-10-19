'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Scale } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { formatShortStamp } from '@/utilis/format';
import { adminService } from '@/services/admin.service';
import type { AdminProof, ProofDecision } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { AdminCard, AdminGate, AdminHeader, DecisionDialog, EmptyRow, TabBar, useAdminGuard } from '@/components/admin/AdminParts';

/** Preuves du badge « Formé » (candidats) et des habilitations (professionnels réglementés). */
export default function AdminProofsPage() {
  const guard = useAdminGuard(['review_kyc']);
  const [tab, setTab] = useState<AdminProof['status']>('a_verifier');
  const [rows, setRows] = useState<AdminProof[] | null>(null);
  const [target, setTarget] = useState<AdminProof | null>(null);
  const { show: showToast, node: toastNode } = useToast();

  const load = useCallback(() => { adminService.proofs(tab).then(setRows).catch(() => setRows([])); }, [tab]);
  useEffect(() => { if (guard.allowed) load(); }, [guard.allowed, load]);

  return (
    <AdminGate guard={guard}>
      <AdminHeader title="Personnel & pros" subtitle="Les badges « Formé » et « Professionnel habilité » ne s'affichent qu'après validation d'une preuve." />
      <TabBar<AdminProof['status']> label="Statut" value={tab} onChange={setTab}
        tabs={[{ value: 'a_verifier', label: 'À vérifier' }, { value: 'valide', label: 'Validées' }, { value: 'rejete', label: 'Refusées' }]} />
      <AdminCard>
        {rows === null ? <EmptyRow>Chargement…</EmptyRow> : rows.length === 0 ? <EmptyRow>Aucune preuve.</EmptyRow> : (
          <ul className="divide-y divide-slate-100">
            {rows.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                {p.kind === 'training' ? <GraduationCap className="w-5 h-5 text-perso" /> : <Scale className="w-5 h-5 text-brand" />}
                <div className="min-w-[220px] flex-1">
                  <p className="text-sm font-medium text-navy">{p.userName} — {p.label}</p>
                  <p className="text-xs text-slate-500">
                    {p.kind === 'training' ? 'Badge Formé' : 'Habilitation professionnelle'} ·{' '}
                    <Link href={p.kind === 'training' ? URL.v2.candidate(p.itemId) : URL.v2.serviceProvider(p.itemId)} target="_blank" className="underline">{p.itemTitle}</Link>
                    {' '}· {formatShortStamp(p.submittedAt)}
                  </p>
                </div>
                {p.status === 'a_verifier' && <button type="button" onClick={() => setTarget(p)} className="h-8 px-3 rounded-lg bg-brand text-white text-xs font-semibold">Décider</button>}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
      {target && (
        <DecisionDialog<ProofDecision>
          open onOpenChange={(o) => { if (!o) setTarget(null); }}
          title={target.label} description={target.userName}
          options={[{ value: 'approve', label: 'Preuve conforme : activer le badge' }, { value: 'reject', label: 'Refuser', negative: true }]}
          onConfirm={async (d, reason) => { await adminService.proofDecision(guard.actor, target.id, d, reason); showToast('Décision enregistrée'); load(); }}
        />
      )}
      {toastNode}
    </AdminGate>
  );
}
