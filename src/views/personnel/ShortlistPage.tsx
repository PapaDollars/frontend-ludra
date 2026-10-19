'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Loader2, Lock, MessageCircle, Trash2 } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { saveBlob } from '@/utilis/utils';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { candidateService } from '@/services/candidate.service';
import type { ShortlistEntry } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { useToast } from '@/components/ui/Toast';
import { CandidateRow } from './components/CandidateRow';
import { useRecruiterAccess } from './useRecruiterAccess';

/** Shortlist recruteur (forfaits M13) : contact, retrait, export selon droits. */
export default function ShortlistPage() {
  const { ready } = useRequireAuth();
  const { access } = useRecruiterAccess(ready);
  const [entries, setEntries] = useState<ShortlistEntry[] | null>(null);
  const { show: showToast, node: toastNode } = useToast();

  const canUse = !!access?.rights.shortlist;
  const load = useCallback(() => {
    candidateService.shortlist().then(setEntries).catch((e) => { setEntries([]); showToast(e instanceof Error ? e.message : 'Shortlist indisponible'); });
  }, [showToast]);
  useEffect(() => { if (canUse) load(); }, [canUse, load]);

  const remove = async (id: string) => {
    try { setEntries(await candidateService.removeFromShortlist(id)); } catch (e) { showToast(e instanceof Error ? e.message : 'Action impossible'); }
  };

  const exportCsv = async () => {
    try { saveBlob(await candidateService.exportShortlist(), 'shortlist-ludra.csv'); } catch (e) { showToast(e instanceof Error ? e.message : 'Export impossible'); }
  };

  if (!ready || !access) return <ShellColumns><div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div></ShellColumns>;

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <header className="mx-4 md:mx-0 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-navy">Ma shortlist</h1>
            {access.planName && <p className="text-sm text-slate-500">Forfait {access.planName} · jusqu&apos;au {new Date(access.expiresAt!).toLocaleDateString('fr-FR')}</p>}
          </div>
          {canUse && (
            access.rights.exportShortlist ? (
              <button type="button" onClick={exportCsv} disabled={!entries?.length} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-navy disabled:opacity-50">
                <Download className="w-4 h-4" /> Exporter (CSV)
              </button>
            ) : (
              <Link href={URL.v2.recruiterPlans} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-500">
                <Lock className="w-3.5 h-3.5" /> Export avec le forfait Formé
              </Link>
            )
          )}
        </header>

        {!canUse ? (
          <div className="mx-4 md:mx-0 rounded-2xl bg-white border border-slate-200 p-8 text-center">
            <p className="font-semibold text-navy mb-1">La shortlist est réservée aux forfaits recruteurs</p>
            <p className="text-sm text-slate-500 mb-4">Activez un forfait pour présélectionner et contacter les candidats.</p>
            <Link href={URL.v2.recruiterPlans} className="inline-flex h-10 px-5 items-center rounded-lg bg-brand text-white text-sm font-semibold">Voir les forfaits</Link>
          </div>
        ) : entries === null ? (
          <Loader2 className="mx-auto w-5 h-5 animate-spin text-brand" />
        ) : entries.length === 0 ? (
          <p className="mx-4 md:mx-0 rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
            Aucun candidat présélectionné. <Link href={URL.v2.personnel} className="font-semibold text-brand underline">Parcourir les profils</Link>
          </p>
        ) : (
          <section aria-label="Candidats présélectionnés" className="flex flex-col gap-3">
            {entries.map(({ candidate: c }) => (
              <CandidateRow key={c.id} c={c} actions={(
                <div className="flex gap-1">
                  <Link href={`${URL.v2.messages}?to=${c.publisher.id}&item=${c.id}`} aria-label={`Contacter ${c.publisher.name}`} className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand text-brand"><MessageCircle className="w-4 h-4" /></Link>
                  <button type="button" onClick={() => remove(c.id)} aria-label={`Retirer ${c.publisher.name}`} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              )} />
            ))}
          </section>
        )}
      </div>
      {toastNode}
    </ShellColumns>
  );
}
