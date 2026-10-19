'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Info, Loader2, ShieldAlert, Sparkles } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { kycService } from '@/services/kyc.service';
import { KYC_STATUS_LABEL } from '@/lib/kycRequirements';
import type { KycDossier } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { PlanCard } from '@/components/plans/PlanCard';
import { usePlans } from '@/components/plans/usePlans';

/** Module 08 — Abonnements Propriétaire / Agent (montants administrables). */
export default function OwnerPlansPage() {
  const { ready, user } = useRequireAuth();
  const [kyc, setKyc] = useState<KycDossier | null>(null);

  const refreshKyc = useCallback(async () => { setKyc(await kycService.get()); }, []);
  useEffect(() => { if (ready) refreshKyc().catch(() => undefined); }, [ready, refreshKyc]);

  const kycOk = kyc?.status === 'verifie';
  const { plans, current, error, choose, checkout } = usePlans('owner_agent', {
    enabled: ready,
    defaultPhone: user?.phone,
    onActivated: refreshKyc,
    paidExtra: () => !kycOk && (
      <p className="mt-1">Pensez à <Link href={URL.v2.certification} className="font-semibold text-brand underline">finaliser votre certification</Link> pour afficher le badge.</p>
    ),
  });

  if (!ready || (!plans && !error)) {
    return <ShellColumns><div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div></ShellColumns>;
  }

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <header className="mx-4 md:mx-0 text-center md:py-2">
          <h1 className="text-xl font-bold text-navy">Abonnements Propriétaire / Agent</h1>
          <p className="text-sm text-slate-500">Certification mensuelle + avantages de visibilité.</p>
        </header>

        {error && <p role="alert" className="mx-4 md:mx-0 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        {current && (
          <p className="mx-4 md:mx-0 flex items-center gap-2 rounded-xl border border-trust/30 bg-trust-50 px-4 py-3 text-sm text-trust">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Plan <strong>{current.planName}</strong> actif jusqu&apos;au {new Date(current.expiresAt).toLocaleDateString('fr-FR')}.</span>
          </p>
        )}

        {kyc && !kycOk && (
          <p className="mx-4 md:mx-0 flex items-start gap-2 rounded-xl border border-amber-200 bg-caution-50 px-4 py-3 text-sm text-amber-900">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Certification : <strong>{KYC_STATUS_LABEL[kyc.status]}</strong>. Le badge s&apos;affiche quand votre identité est vérifiée.{' '}
              <Link href={URL.v2.certification} className="font-semibold underline">Compléter ma certification</Link>
            </span>
          </p>
        )}

        <div className="mx-4 md:mx-0 grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans?.map((p) => <PlanCard key={p.code} plan={p} current={current?.planCode === p.code} onChoose={choose} />)}
        </div>

        <p className="mx-4 md:mx-0 flex gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-500">
          <Info className="w-4 h-4 shrink-0 text-brand" />
          Un plan payant augmente la visibilité mais ne remplace jamais la pertinence : une annonce non pertinente ne passe pas devant.
          Toute mise en avant commerciale est signalée « Sponsorisé ». Montants et avantages fixés par LUDRA, susceptibles d&apos;évoluer.
        </p>
      </div>
      {checkout}
    </ShellColumns>
  );
}
