'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Info, Loader2, Sparkles, UserPlus } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { candidateService } from '@/services/candidate.service';
import type { CandidateFeedItem, Plan } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { PlanCard } from '@/components/plans/PlanCard';
import { usePlans } from '@/components/plans/usePlans';
import { useToast } from '@/components/ui/Toast';

/** Module 12 — Abonnements candidats : profil gratuit, puis Standard 500 F et Premium 1 000 F. */
export default function CandidatePlansPage() {
  const { ready, user } = useRequireAuth();
  const [profile, setProfile] = useState<CandidateFeedItem | null | undefined>(undefined);
  const { show: showToast, node: toastNode } = useToast();

  const loadProfile = () => candidateService.myProfile().then(setProfile).catch(() => setProfile(null));
  useEffect(() => { if (ready) loadProfile(); }, [ready]);

  const { plans, current, error, choose, checkout } = usePlans('candidate', {
    enabled: ready,
    defaultPhone: user?.phone,
    onActivated: loadProfile,
    paidExtra: () => <p className="mt-1">Votre profil remonte dans les résultats. Vos compétences, elles, ne changent pas.</p>,
  });

  const onChoose = (plan: Plan) => {
    if (plan.price === 0) {
      showToast(current ? 'Votre plan actuel reste actif jusqu’à expiration, puis le profil repasse en Gratuit.' : 'Vous êtes déjà sur le plan Gratuit.');
      return;
    }
    if (!profile) {
      showToast('Créez d’abord votre profil candidat (gratuit).');
      return;
    }
    choose(plan);
  };

  if (!ready || (!plans && !error) || profile === undefined) {
    return <ShellColumns><div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div></ShellColumns>;
  }

  const isCurrent = (p: Plan) => (current ? current.planCode === p.code : p.price === 0);

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <header className="mx-4 md:mx-0 text-center md:py-2">
          <h1 className="text-xl font-bold text-navy">Abonnements candidats</h1>
          <p className="text-sm text-slate-500">Créer un compte reste gratuit. Les plans augmentent la visibilité et le ciblage.</p>
        </header>

        {error && <p role="alert" className="mx-4 md:mx-0 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        {!profile && (
          <p className="mx-4 md:mx-0 flex flex-wrap items-center gap-2 rounded-xl bg-perso-50 px-4 py-3 text-sm text-perso">
            <UserPlus className="w-4 h-4 shrink-0" />
            <span className="flex-1">Vous n&apos;avez pas encore de profil candidat.</span>
            <Link href={URL.v2.publish} className="font-semibold underline">Créer mon profil gratuit</Link>
          </p>
        )}

        {current && (
          <p className="mx-4 md:mx-0 flex items-center gap-2 rounded-xl border border-perso/30 bg-perso-50 px-4 py-3 text-sm text-perso">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Plan <strong>{current.planName}</strong> actif jusqu&apos;au {new Date(current.expiresAt).toLocaleDateString('fr-FR')}.</span>
          </p>
        )}

        <div className="mx-4 md:mx-0 grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans?.map((p) => <PlanCard key={p.code} plan={p} current={isCurrent(p)} onChoose={onChoose} />)}
        </div>

        <ul className="mx-4 md:mx-0 flex flex-col gap-1 rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-500">
          <li className="flex gap-2"><Info className="w-4 h-4 shrink-0 text-brand" /><span><strong className="text-navy">Le salaire n&apos;est jamais garanti.</strong> Les fourchettes ciblent des offres, elles ne promettent pas de rémunération.</span></li>
          <li className="pl-6">Le paiement change votre classement, pas vos compétences ni vos badges (« Formé » et « Identité vérifiée » reposent sur des preuves).</li>
          <li className="pl-6">Plan et date d&apos;expiration visibles dans Mon compte.</li>
        </ul>
      </div>
      {checkout}
      {toastNode}
    </ShellColumns>
  );
}
