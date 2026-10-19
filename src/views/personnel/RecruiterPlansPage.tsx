'use client';

import Link from 'next/link';
import { Info, ListChecks, Loader2, Sparkles } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { PlanCard } from '@/components/plans/PlanCard';
import { usePlans } from '@/components/plans/usePlans';
import { useRecruiterAccess } from './useRecruiterAccess';

/** Module 13 — Forfaits recruteurs / chefs d'entreprise. */
export default function RecruiterPlansPage() {
  const { ready, user } = useRequireAuth();
  const { refresh } = useRecruiterAccess(ready);
  const { plans, current, error, choose, checkout } = usePlans('recruiter', {
    enabled: ready,
    defaultPhone: user?.phone,
    onActivated: refresh,
    paidExtra: () => (
      <p className="mt-1"><Link href={URL.v2.personnel} className="font-semibold text-brand underline">Rechercher des profils</Link></p>
    ),
  });

  if (!ready || (!plans && !error)) {
    return <ShellColumns><div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div></ShellColumns>;
  }

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <header className="mx-4 md:mx-0 text-center md:py-2">
          <h1 className="text-xl font-bold text-navy">Forfaits recruteurs / chefs d&apos;entreprise</h1>
          <p className="text-sm text-slate-500">Accès gradué aux profils, filtres avancés et présélection.</p>
        </header>

        {error && <p role="alert" className="mx-4 md:mx-0 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        {current && (
          <div className="mx-4 md:mx-0 flex flex-wrap items-center gap-2 rounded-xl border border-trust/30 bg-trust-50 px-4 py-3 text-sm text-trust">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="flex-1">Forfait <strong>{current.planName}</strong> actif jusqu&apos;au {new Date(current.expiresAt).toLocaleDateString('fr-FR')}. Les droits sont révoqués à l&apos;expiration.</span>
            <Link href={URL.v2.shortlist} className="inline-flex items-center gap-1 font-semibold underline"><ListChecks className="w-4 h-4" /> Ma shortlist</Link>
          </div>
        )}

        <div className="mx-4 md:mx-0 grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans?.map((p) => <PlanCard key={p.code} plan={p} current={current?.planCode === p.code} onChoose={choose} />)}
        </div>

        <ul className="mx-4 md:mx-0 flex flex-col gap-1 rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-500">
          <li className="flex gap-2"><Info className="w-4 h-4 shrink-0 text-brand" /><span>Vous pouvez toujours trier par <strong className="text-navy">pertinence seule</strong>, indépendamment du plan des candidats.</span></li>
          <li className="pl-6">Historique d&apos;abonnement et factures : <Link href={URL.v2.payments} className="underline">Mon compte › Paiements</Link>.</li>
        </ul>
      </div>
      {checkout}
    </ShellColumns>
  );
}
