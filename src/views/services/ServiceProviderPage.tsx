'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flag, MapPin, MessageCircle, Scale } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { formatAmount } from '@/utilis/format';
import { ApiError } from '@/lib/api';
import { useRole } from '@/hooks/useRole';
import { servicesService } from '@/services/services.service';
import type { ServiceProviderDetail } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Pill } from '@/components/ui/Pill';
import { Rating } from '@/components/ui/Rating';
import { useToast } from '@/components/ui/Toast';
import { ReportDialog } from '@/components/report/ReportDialog';
import { MediaCarousel } from '@/views/listing/components/MediaCarousel';
import { NotGuaranteedNote, RegulatedNote, ServicesSafetyCard } from './components/ServiceParts';

/** Profil prestataire (M14) : carte, profil, avis, message, signalement. */
export default function ServiceProviderPage({ id }: { id: string }) {
  const router = useRouter();
  const { isAuthenticated } = useRole();
  const [p, setP] = useState<ServiceProviderDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { show: showToast, node: toastNode } = useToast();

  useEffect(() => {
    servicesService.provider(id).then(setP).catch((e) => { if (e instanceof ApiError && e.status === 404) setNotFound(true); else showToast('Profil indisponible'); });
  }, [id, showToast]);

  if (notFound) {
    return (
      <ShellColumns>
        <div className="mx-4 md:mx-0 mt-4 md:mt-0 bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <h1 className="text-xl font-bold text-navy mb-2">Prestataire introuvable</h1>
          <Link href={URL.v2.services} className="inline-flex h-10 px-5 items-center rounded-lg bg-brand text-white text-sm font-semibold">Tous les services</Link>
        </div>
      </ShellColumns>
    );
  }
  if (!p) return <ShellColumns><div className="h-[50vh] animate-pulse mx-4 md:mx-0 rounded-2xl bg-white" />{toastNode}</ShellColumns>;

  const name = p.businessName ?? p.publisher.name;

  return (
    <ShellColumns right={<ServicesSafetyCard />}>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push(URL.v2.serviceCategory(p.category)))} className="mx-4 md:mx-0 self-start inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <article className="bg-white md:rounded-2xl border-y md:border border-slate-200 overflow-hidden">
          {p.media.length > 0 && <MediaCarousel media={p.media} title={p.title} />}
          <div className="p-4 md:p-6 flex flex-col gap-4">
            <header className="flex flex-col sm:flex-row sm:items-start gap-4">
              <UserAvatar name={name} src={p.publisher.avatar} size="lg" className="!bg-service-50 !text-service" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-navy">{name}</h1>
                <div className="flex flex-wrap gap-1.5 my-1">
                  <Link href={URL.v2.serviceCategory(p.category)}><Pill tone="service-soft">{p.categoryLabel}</Pill></Link>
                  {p.badges.identityVerified && <Pill tone="trust">Identité vérifiée</Pill>}
                  {p.regulated && (p.badges.regulatedVerified
                    ? <Pill tone="brand"><Scale className="w-3 h-3" /> {p.regulatedProfession ?? 'Professionnel'} habilité</Pill>
                    : <Pill tone="neutral-soft">Habilitation non vérifiée</Pill>)}
                </div>
                <p className="text-sm text-slate-600">{p.title}</p>
                <Link href={URL.v2.reviews(p.publisher.id)} className="inline-flex mt-1 hover:underline"><Rating value={p.publisher.rating} count={p.publisher.reviewsCount} /></Link>
              </div>
              {!p.viewerIsOwner && (
                <Link href={`${URL.v2.messages}?to=${p.publisher.id}&item=${p.id}`} className="h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand text-white text-sm font-semibold">
                  <MessageCircle className="w-4 h-4" /> Demander un devis
                </Link>
              )}
            </header>

            {p.regulated && <RegulatedNote />}

            <section aria-labelledby="svc-desc">
              <h2 id="svc-desc" className="font-semibold text-navy mb-1">Prestations</h2>
              <p className="text-sm text-slate-600 whitespace-pre-line">{p.description}</p>
            </section>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-surface p-3">
                <dt className="text-xs text-slate-500">Structure</dt>
                <dd className="font-medium text-navy">{p.structure === 'entreprise' ? 'Entreprise' : 'Indépendant'}</dd>
              </div>
              <div className="rounded-xl bg-surface p-3">
                <dt className="text-xs text-slate-500">Tarif indicatif</dt>
                <dd className="font-medium text-navy">{p.priceFrom !== undefined ? `À partir de ${formatAmount(p.priceFrom)}` : 'Sur devis'}</dd>
              </div>
              <div className="rounded-xl bg-surface p-3">
                <dt className="text-xs text-slate-500">Zones desservies</dt>
                <dd className="font-medium text-navy flex flex-wrap gap-1">
                  {p.zones.map((z) => <span key={z} className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400" />{z}</span>)}
                </dd>
              </div>
            </dl>

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
              <span>La messagerie est gratuite : aucune coordonnée n&apos;est partagée automatiquement.</span>
              {!p.viewerIsOwner && (
                <button type="button" onClick={() => (isAuthenticated ? setReportOpen(true) : router.push(URL.auth.loginThen(URL.v2.serviceProvider(id))))} className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600">
                  <Flag className="w-3.5 h-3.5" /> Signaler
                </button>
              )}
            </footer>
          </div>
        </article>

        <NotGuaranteedNote className="mx-4 md:mx-0" />
      </div>
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} targetType="user" targetId={p.publisher.id} onDone={() => showToast('Merci, votre signalement a été transmis')} />
      {toastNode}
    </ShellColumns>
  );
}
