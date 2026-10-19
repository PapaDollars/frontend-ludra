'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, CheckCircle2, Circle, Loader2, Lock, ShieldCheck } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { formatDayLabel, formatClock } from '@/utilis/format';
import {
  KYC_EDITABLE, KYC_STATUS_LABEL, isRequirementMet, missingRequirements, requirementsFor, type KycRequirement,
} from '@/lib/kycRequirements';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { searchService } from '@/services/search.service';
import type { KycDossier, KycStatus, SearchOptions } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { Pill, type PillTone } from '@/components/ui/Pill';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { useToast } from '@/components/ui/Toast';

import { useKyc } from './useKyc';
import { DocumentSlot } from './components/DocumentSlot';
import { LocationsEditor } from './components/LocationsEditor';

const STATUS_TONE: Record<KycStatus, PillTone> = {
  a_completer: 'neutral-soft', soumis: 'brand-soft', en_revue: 'caution', verifie: 'trust', rejete: 'danger', expire: 'neutral',
};

const SIDE_LABEL = { recto: 'Recto', verso: 'Verso' } as const;
const DOC_LABEL = { professional_card: 'Carte pro', mandate: 'Mandat', property_proof: 'Justificatif', identity: 'CNI' } as const;

export function KycStatusPill({ status }: { status: KycStatus }) {
  return <Pill tone={STATUS_TONE[status]}>Statut : {KYC_STATUS_LABEL[status]}</Pill>;
}

function RequirementRow({ req, dossier, editable, kyc, options }: {
  req: KycRequirement; dossier: KycDossier; editable: boolean; kyc: ReturnType<typeof useKyc>; options: SearchOptions | null;
}) {
  const met = isRequirementMet(req, dossier);
  const findDoc = (type: string, side?: string) => dossier.documents.find((d) => d.type === type && d.side === side);

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3 mb-2">
        {met ? <CheckCircle2 className="w-5 h-5 text-trust shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
        <div>
          <p className="text-sm font-semibold text-navy">{req.label}</p>
          <p className="text-xs text-slate-500">{req.hint}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 pl-8">
        {req.kind === 'location' ? (
          <LocationsEditor locations={dossier.locations} options={options} editable={editable} onChange={kyc.setLocations} />
        ) : req.sides ? (
          req.sides.map((side) => (
            <DocumentSlot key={side} label={SIDE_LABEL[side]} doc={findDoc('identity', side)} editable={editable}
              onUpload={(f) => kyc.upload(f, 'identity', side)} onRemove={(d) => kyc.removeDocument(d.id)} />
          ))
        ) : (
          req.docTypes!.map((type) => (
            <DocumentSlot key={type} label={DOC_LABEL[type]} doc={findDoc(type)} editable={editable}
              onUpload={(f) => kyc.upload(f, type)} onRemove={(d) => kyc.removeDocument(d.id)} />
          ))
        )}
        {req.docTypes && req.docTypes.length > 1 && <p className="text-[11px] text-slate-400">Une seule de ces pièces suffit.</p>}
      </div>
    </li>
  );
}

/** Module 07 — Certification Propriétaire / Agent. */
export default function CertificationPage() {
  const { ready } = useRequireAuth();
  const kyc = useKyc(ready);
  const { dossier } = kyc;
  const { show: showToast, node: toastNode } = useToast();
  const [options, setOptions] = useState<SearchOptions | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  useEffect(() => { searchService.getOptions().then(setOptions).catch(() => undefined); }, []);

  if (!ready || !dossier) {
    return (
      <ShellColumns>
        <div className="flex h-[50vh] items-center justify-center">
          {kyc.error ? <p className="text-sm text-red-600">{kyc.error}</p> : <Loader2 className="w-6 h-6 animate-spin text-brand" />}
        </div>
      </ShellColumns>
    );
  }

  const editable = KYC_EDITABLE.includes(dossier.status);
  const reqs = dossier.profile ? requirementsFor(dossier.profile) : [];
  const done = reqs.filter((r) => isRequirementMet(r, dossier)).length;
  const complete = !!dossier.profile && missingRequirements(dossier).length === 0;

  const onSubmit = async () => {
    setSubmitting(true);
    const errs = await kyc.submit();
    setSubmitErrors(errs);
    setSubmitting(false);
    if (!errs.length) showToast('Dossier envoyé à la vérification');
  };

  const onProfile = async (p: 'owner' | 'agent') => {
    try { await kyc.setProfile(p); } catch (e) { showToast(e instanceof Error ? e.message : 'Action impossible'); }
  };

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <header className="mx-4 md:mx-0 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-navy">Certification du compte</h1>
            <p className="text-sm text-slate-500">Les pièces sont privées. Le public ne voit que le badge et le statut.</p>
          </div>
          <KycStatusPill status={dossier.status} />
        </header>

        {dossier.status === 'rejete' && dossier.rejectionReason && (
          <p role="alert" className="mx-4 md:mx-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>Dossier rejeté :</strong> {dossier.rejectionReason} Corrigez la pièce concernée puis soumettez à nouveau.
          </p>
        )}

        <div className="flex flex-col gap-4 desk:grid desk:grid-cols-[minmax(0,1fr)_300px] desk:items-start">
          <div className="flex flex-col gap-4">
            <section aria-labelledby="kyc-profile" className="mx-4 md:mx-0 bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
              <h2 id="kyc-profile" className="mb-3 text-sm font-semibold text-navy">Vous êtes…</h2>
              <fieldset disabled={!editable} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <legend className="sr-only">Profil à certifier</legend>
                <ChoiceCard name="kyc-profile" value="owner" selected={dossier.profile === 'owner'} onSelect={() => onProfile('owner')}
                  title="Propriétaire / bailleur" description="CNI + justificatif lié au bien + localisation" />
                <ChoiceCard name="kyc-profile" value="agent" selected={dossier.profile === 'agent'} onSelect={() => onProfile('agent')}
                  title="Agent immobilier" description="CNI + carte pro / mandat + biens et lieux" />
              </fieldset>
            </section>

            {dossier.profile && (
              <section aria-labelledby="kyc-docs" className="mx-4 md:mx-0 bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
                <h2 id="kyc-docs" className="mb-3 text-sm font-semibold text-navy">Documents requis</h2>
                <ul className="flex flex-col gap-3">
                  {reqs.map((r) => <RequirementRow key={r.key} req={r} dossier={dossier} editable={editable} kyc={kyc} options={options} />)}
                </ul>
                <p className="mt-3 text-[11px] text-slate-400">JPG, PNG, WebP ou PDF · 10 Mo maximum par fichier.</p>
              </section>
            )}

            {dossier.history.length > 1 && (
              <section aria-labelledby="kyc-history" className="mx-4 md:mx-0 bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
                <h2 id="kyc-history" className="mb-3 text-sm font-semibold text-navy">Historique</h2>
                <ol className="flex flex-col gap-2 border-l-2 border-slate-100 pl-4">
                  {[...dossier.history].reverse().map((h, i) => (
                    <li key={`${h.at}-${i}`} className="text-xs">
                      <span className="font-semibold text-navy">{KYC_STATUS_LABEL[h.status]}</span>
                      <span className="text-slate-400"> · {formatDayLabel(h.at)} {formatClock(h.at)}</span>
                      {h.note && <p className="text-slate-500">{h.note}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* Badge + soumission */}
          <aside className="mx-4 md:mx-0 flex flex-col gap-4 desk:sticky desk:top-20">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
              <div className={cn('mx-auto mb-3 w-20 h-20 rounded-full flex items-center justify-center', dossier.status === 'verifie' ? 'bg-trust-50' : 'bg-brand-50')}>
                <BadgeCheck className={cn('w-10 h-10', dossier.status === 'verifie' ? 'text-trust' : 'text-brand')} />
              </div>
              <p className="font-semibold text-navy">Badge LUDRA Vérifié</p>
              <p className="text-xs text-slate-500 mb-4">Contrôle identité + justificatifs</p>

              {dossier.status === 'verifie' ? (
                <div className="flex flex-col gap-2 text-sm">
                  <p className="text-trust font-semibold">Identité vérifiée{dossier.expiresAt && ` jusqu'au ${new Date(dossier.expiresAt).toLocaleDateString('fr-FR')}`}</p>
                  {dossier.badgeActive ? (
                    <p className="text-xs text-slate-500">Le badge est visible sur vos annonces et votre profil.</p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Activez un abonnement pour afficher le badge publiquement.{' '}
                      <Link href={URL.v2.subscriptions} className="font-semibold text-brand underline">Voir les abonnements</Link>
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {dossier.profile && (
                    <div className="mb-3">
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={reqs.length} aria-label="Éléments fournis">
                        <div className="h-full bg-brand transition-all" style={{ width: `${(done / reqs.length) * 100}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">{done} / {reqs.length} éléments fournis</p>
                    </div>
                  )}
                  {editable ? (
                    <button type="button" onClick={onSubmit} disabled={!complete || submitting}
                      className="w-full h-10 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 inline-flex items-center justify-center gap-2">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {dossier.status === 'a_completer' ? 'Soumettre à vérification' : 'Soumettre à nouveau'}
                    </button>
                  ) : (
                    <p className="text-sm text-slate-600" role="status">
                      Vérification en cours (généralement sous 24 h). Le dossier est verrouillé pendant le contrôle.
                    </p>
                  )}
                  {submitErrors.length > 0 && (
                    <ul role="alert" className="mt-2 text-left text-xs text-red-600 list-disc pl-4">
                      {submitErrors.map((e) => <li key={e}>{e}</li>)}
                    </ul>
                  )}
                </>
              )}
              <div className="mt-3"><KycStatusPill status={dossier.status} /></div>
            </section>

            <section className="rounded-2xl bg-brand-50 p-4 text-xs text-brand-700">
              <p className="flex items-center gap-1.5 font-semibold mb-1"><Lock className="w-3.5 h-3.5" /> Confidentialité KYC</p>
              <p>Vos pièces sont chiffrées et consultées uniquement par l&apos;équipe de vérification. Elles ne sont jamais affichées publiquement : seul le badge l&apos;est.</p>
            </section>
            <Link href={URL.v2.subscriptions} className="text-center text-xs font-semibold text-brand hover:underline inline-flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Abonnements Propriétaire / Agent
            </Link>
          </aside>
        </div>
      </div>
      {toastNode}
    </ShellColumns>
  );
}
