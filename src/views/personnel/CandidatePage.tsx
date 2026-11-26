'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flag, ListPlus, ListChecks, MessageCircle, Rocket } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { formatAmount } from '@/utilis/format';
import { ApiError } from '@/lib/api';
import { useRole } from '@/hooks/useRole';
import { candidateService } from '@/services/candidate.service';
import type { CandidateDetail } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Pill } from '@/components/ui/Pill';
import { Rating } from '@/components/ui/Rating';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ReportDialog } from '@/components/report/ReportDialog';
import { CandidatePlanPill } from './components/CandidateRow';

const AVAILABILITY = { immediate: 'Immédiate', sous_15_jours: 'Sous 15 jours', a_convenir: 'À convenir' } as const;

const salaryLabel = (c: CandidateDetail) => {
  if (c.salaryMin === undefined && c.salaryMax === undefined) return 'Non précisé';
  if (c.salaryMin !== undefined && c.salaryMax !== undefined) return `${formatAmount(c.salaryMin)} – ${formatAmount(c.salaryMax)}`;
  return c.salaryMin !== undefined ? `À partir de ${formatAmount(c.salaryMin)}` : `Jusqu'à ${formatAmount(c.salaryMax!)}`;
};

/** Module 11 — Profil candidat : informations professionnelles uniquement. */
export default function CandidatePage({ id }: { id: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRole();
  const [c, setC] = useState<CandidateDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { show: showToast, node: toastNode } = useToast();

  const load = useCallback(async () => {
    try { setC(await candidateService.get(id, isAuthenticated)); } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotFound(true);
      else setError(e instanceof Error ? e.message : 'Impossible de charger le profil.');
    }
  }, [id, isAuthenticated]);

  useEffect(() => { if (!isLoading) load(); }, [isLoading, load]);

  if (notFound || error) {
    return (
      <ShellColumns>
        <div className="mx-4 md:mx-0 mt-4 md:mt-0 bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <h1 className="text-xl font-bold text-navy mb-2">{notFound ? 'Profil introuvable' : 'Erreur de chargement'}</h1>
          <p className="text-sm text-slate-500 mb-6">{notFound ? "Ce profil n'existe plus ou a été masqué." : error}</p>
          <Link href={URL.v2.personnel} className="inline-flex h-10 px-5 items-center rounded-lg bg-brand text-white text-sm font-semibold">Voir les profils</Link>
        </div>
      </ShellColumns>
    );
  }
  if (!c) return <ShellColumns><div className="h-[50vh] animate-pulse mx-4 md:mx-0 rounded-2xl bg-white" /></ShellColumns>;

  const access = c.viewerAccess;

  const onContact = () => {
    if (!access.canContact) return router.push(URL.auth.loginThen(URL.v2.candidate(id)));
    router.push(`${URL.v2.messages}?to=${c.publisher.id}&item=${c.id}`);
  };

  const onShortlist = async () => {
    if (!access.canShortlist) return setGateOpen(true);
    setBusy(true);
    try {
      if (access.shortlisted) await candidateService.removeFromShortlist(c.id);
      else await candidateService.addToShortlist(c.id);
      setC({ ...c, viewerAccess: { ...access, shortlisted: !access.shortlisted } });
      showToast(access.shortlisted ? 'Retiré de la shortlist' : 'Ajouté à la shortlist');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Action impossible');
    } finally {
      setBusy(false);
    }
  };

  const rows: [string, string][] = [
    ['Métier', c.job],
    ['Expérience', `${c.experienceYears} an${c.experienceYears > 1 ? 's' : ''}`],
    ...(c.license ? [['Permis', c.license] as [string, string]] : []),
    ['Disponibilité', AVAILABILITY[c.availability]],
    ['Salaire visé', salaryLabel(c)],
    ['Formation', c.training ?? '—'],
    ['Références', c.references.total ? `${c.references.verified} contrôlée${c.references.verified > 1 ? 's' : ''} sur ${c.references.total}` : '—'],
  ];

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push(URL.v2.personnel))} className="mx-4 md:mx-0 self-start inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <article className="bg-white md:rounded-2xl border-y md:border border-slate-200 p-4 md:p-6 flex flex-col gap-5">
          <header className="flex flex-col sm:flex-row sm:items-start gap-4">
            <UserAvatar name={c.publisher.name} src={c.publisher.avatar} size="lg" className="!bg-perso-50 !text-perso" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-navy">{c.publisher.name}</h1>
              <div className="flex flex-wrap gap-1.5 my-1">
                <CandidatePlanPill plan={c.plan} />
                {c.badges.identityVerified && <Pill tone="trust">Identité OK</Pill>}
                {c.badges.trained && <Pill tone="trust-soft">Formé</Pill>}
              </div>
              <p className="text-sm text-slate-600">{c.job} · {c.experienceYears} ans d&apos;expérience · {[c.district, c.city].filter(Boolean).join(', ')}</p>
              <Link href={URL.v2.reviews(c.publisher.id)} className="inline-flex mt-1 hover:underline"><Rating value={c.publisher.rating} count={c.publisher.reviewsCount} /></Link>
            </div>
            {c.viewerIsOwner ? (
              <Link href={URL.v2.candidatePlans} className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg bg-perso text-white text-sm font-semibold">
                <Rocket className="w-4 h-4" /> Booster mon profil
              </Link>
            ) : (
              <div className="flex flex-col sm:items-end gap-2">
                <button type="button" onClick={onContact} className="h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand text-white text-sm font-semibold">
                  <MessageCircle className="w-4 h-4" /> Contacter
                </button>
                <button type="button" onClick={onShortlist} disabled={busy} aria-pressed={access.shortlisted}
                  className="h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand text-brand text-sm font-semibold disabled:opacity-60">
                  {access.shortlisted ? <ListChecks className="w-4 h-4" /> : <ListPlus className="w-4 h-4" />}
                  {access.shortlisted ? 'Dans ma shortlist' : 'Présélectionner'}
                </button>
              </div>
            )}
          </header>

          <div className="grid gap-5 md:grid-cols-2">
            <section aria-labelledby="pro-title">
              <h2 id="pro-title" className="font-semibold text-navy mb-2">Profil professionnel</h2>
              <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex gap-3 px-3 py-2 text-sm">
                    <dt className="w-28 shrink-0 text-slate-500">{k}</dt>
                    <dd className="flex-1 font-medium text-navy break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[11px] text-slate-400">Le salaire visé est une attente du candidat, jamais une promesse de LUDRA.</p>
            </section>
            <section aria-labelledby="summary-title" className="rounded-xl border border-slate-200 p-4">
              <h2 id="summary-title" className="font-semibold text-navy mb-2">Résumé</h2>
              <p className="text-sm text-slate-600 whitespace-pre-line">{c.summary}</p>
              {c.skills.length > 0 && (
                <>
                  <h3 className="mt-4 mb-2 text-sm font-semibold text-navy">Compétences</h3>
                  <ul className="flex flex-wrap gap-2">
                    {c.skills.map((s) => <li key={s} className="rounded-full bg-perso-50 px-3 py-1 text-xs font-medium text-perso">{s}</li>)}
                  </ul>
                </>
              )}
            </section>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            <span>Documents privés : seuls les badges vérifiés sont publics. Aucune donnée personnelle sensible n&apos;est affichée.</span>
            {!c.viewerIsOwner && (
              <button type="button" onClick={() => (isAuthenticated ? setReportOpen(true) : router.push(URL.auth.loginThen(URL.v2.candidate(id))))} className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600">
                <Flag className="w-3.5 h-3.5" /> Signaler
              </button>
            )}
          </footer>
        </article>
      </div>

      <Modal
        open={gateOpen}
        onOpenChange={setGateOpen}
        title="Présélection réservée aux recruteurs"
        description="La présélection (shortlist) est ouverte avec un forfait recruteur. Le contact reste gratuit."
        footer={access.reason === 'login' ? (
          <Link href={URL.auth.loginThen(URL.v2.candidate(id))} className="flex h-11 items-center justify-center rounded-lg bg-brand text-white text-sm font-semibold">Se connecter</Link>
        ) : (
          <Link href={URL.v2.recruiterPlans} className="flex h-11 items-center justify-center rounded-lg bg-brand text-white text-sm font-semibold">Voir les forfaits recruteurs</Link>
        )}
      >
        <p className="text-sm text-slate-600">
          Les profils restent consultables gratuitement. Un forfait (à partir de 5 000 F) ouvre l&apos;accès aux meilleurs profils et à la shortlist. Contacter un candidat est gratuit.
        </p>
      </Modal>
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} targetType="user" targetId={c.publisher.id} onDone={() => showToast('Merci, votre signalement a été transmis')} />
      {toastNode}
    </ShellColumns>
  );
}
