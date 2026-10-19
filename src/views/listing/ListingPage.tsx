'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Bath, BedDouble, Flag, Heart, Ruler, Share2, Star } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { formatPrice, timeAgo } from '@/utilis/format';
import { useRole } from '@/hooks/useRole';
import type { ContactDetails, FeedItem, ListingDetail } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { Pill } from '@/components/ui/Pill';
import { useToast } from '@/components/ui/Toast';
import { ReportDialog } from '@/components/report/ReportDialog';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';
import { useReviewEligibility } from '@/components/reviews/useReviewEligibility';
import { useItemActions } from '@/views/feed/useItemActions';

import { useListing } from './useListing';
import { useUnlockContact } from './useUnlockContact';
import { MediaCarousel } from './components/MediaCarousel';
import { PublisherCard } from './components/PublisherCard';
import { DocumentsCard, LandWarning, SafetyNotice } from './components/TrustCards';
import { UnlockContactModal } from './components/UnlockContactModal';

const KIND_LABEL: Record<string, string> = {
  appartement: 'Appartement', studio: 'Studio', chambre: 'Chambre', maison: 'Maison',
  villa: 'Villa', terrain: 'Terrain', bureau: 'Bureau', commerce: 'Local commercial',
};

function ListingSkeleton() {
  return (
    <ShellColumns>
      <div className="animate-pulse flex flex-col gap-4" aria-hidden="true">
        <div className="aspect-[16/10] max-h-[480px] bg-slate-200 md:rounded-2xl" />
        <div className="px-4 md:px-0 space-y-3">
          <div className="h-6 w-2/3 rounded bg-slate-200" />
          <div className="h-5 w-1/3 rounded bg-slate-200" />
        </div>
      </div>
    </ShellColumns>
  );
}

function SecondaryAction({ icon: Icon, label, onClick, active }: { icon: typeof Heart; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn('inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium hover:bg-surface', active ? 'text-brand' : 'text-slate-600')}
    >
      <Icon className={cn('w-4 h-4', active && 'fill-current')} /> {label}
    </button>
  );
}

/** Modules 03 + 04 — Fiche détaillée du bien et contact direct payant. */
export default function ListingPage({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useRole();
  const { listing, loading, notFound, error, reload, patch } = useListing(id);
  const { show: showToast, node: toastNode } = useToast();

  const [contact, setContact] = useState<ContactDetails | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const review = useReviewEligibility(listing?.publisher.id, isAuthenticated && !listing?.viewerIsOwner);
  const refreshReview = review.refresh;

  const unlock = useUnlockContact(id, useCallback((c: ContactDetails) => {
    setContact(c);
    patch({ contact: { unlocked: true, price: listing?.contact.price ?? 0, ...c } });
    refreshReview(); // le contact débloqué ouvre droit à un avis
  }, [patch, listing?.contact.price, refreshReview]));

  // Coordonnées déjà débloquées lors d'une visite précédente
  useEffect(() => {
    if (listing?.contact.unlocked && listing.contact.phone) {
      setContact({ phone: listing.contact.phone, whatsapp: listing.contact.whatsapp ?? null });
    }
  }, [listing?.contact.unlocked, listing?.contact.phone, listing?.contact.whatsapp]);

  // Paiement confirmé alors que la fenêtre était fermée
  useEffect(() => {
    if (unlock.phase === 'paid' && !unlockOpen) showToast('Contact débloqué');
  }, [unlock.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const returnUrl = `${URL.v2.listing(id)}?contact=1`;
  const onUnlock = useCallback(() => {
    if (!isAuthenticated) {
      router.push(URL.auth.loginThen(returnUrl));
      return;
    }
    setUnlockOpen(true);
  }, [isAuthenticated, router, returnUrl]);

  // Arrivée après publication (?published=1)
  const justPublished = searchParams.get('published') === '1';
  const justUpdated = searchParams.get('updated') === '1';
  useEffect(() => {
    if (!(justPublished || justUpdated) || !listing) return;
    showToast(justUpdated ? 'Annonce mise à jour' : 'Votre annonce est en ligne 🎉');
    router.replace(URL.v2.listing(id), { scroll: false });
  }, [justPublished, justUpdated, listing, showToast, router, id]);

  // Arrivée depuis le bouton WhatsApp du feed (?contact=1)
  const wantsContact = searchParams.get('contact') === '1';
  useEffect(() => {
    if (!wantsContact || !listing || authLoading || listing.viewerIsOwner) return;
    router.replace(URL.v2.listing(id), { scroll: false });
    if (!listing.contact.unlocked) onUnlock();
  }, [wantsContact, listing, authLoading, onUnlock, router, id]);

  const updateItem = useCallback((_id: string, p: Partial<FeedItem>) => patch(p as Partial<ListingDetail>), [patch]);
  const { onToggleSave, onShare } = useItemActions(updateItem, showToast);

  const onReport = () => {
    if (!isAuthenticated) return router.push(URL.auth.loginThen(URL.v2.listing(id)));
    setReportOpen(true);
  };

  if (loading && !listing) return <ListingSkeleton />;

  if (notFound || (!listing && error)) {
    return (
      <ShellColumns>
        <div className="mx-4 md:mx-0 mt-4 md:mt-0 bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <h1 className="text-xl font-bold text-navy mb-2">{notFound ? 'Annonce introuvable' : 'Erreur de chargement'}</h1>
          <p className="text-sm text-slate-500 mb-6">
            {notFound ? "Cette annonce n'existe plus ou a été retirée par son publieur." : error}
          </p>
          <div className="flex justify-center gap-2">
            {!notFound && <button type="button" onClick={reload} className="h-10 px-5 rounded-lg border border-slate-200 text-sm font-semibold text-navy">Réessayer</button>}
            <Link href={URL.v2.search} className="inline-flex h-10 px-5 items-center rounded-lg bg-brand text-white text-sm font-semibold">Voir d&apos;autres offres</Link>
          </div>
        </div>
      </ShellColumns>
    );
  }
  if (!listing) return null;

  const isLand = listing.propertyKind === 'terrain';
  const place = [listing.district, listing.city].filter(Boolean).join(', ');
  const specs = [
    listing.bedrooms !== undefined && { icon: BedDouble, label: `${listing.bedrooms} chambre${listing.bedrooms > 1 ? 's' : ''}` },
    listing.bathrooms !== undefined && { icon: Bath, label: `${listing.bathrooms} douche${listing.bathrooms > 1 ? 's' : ''}` },
    listing.surface !== undefined && { icon: Ruler, label: `${listing.surface} m²` },
  ].filter(Boolean) as { icon: typeof Bath; label: string }[];

  return (
    <ShellColumns>
      <div className="pt-3 md:pt-0 px-4 md:px-0 mb-3">
        <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push(URL.v2.feed))} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
      </div>

      {/* Mobile/tablette : une colonne ordonnée ; desktop : contenu + colonne contact collante */}
      <div className="flex flex-col gap-4 desk:grid desk:grid-cols-[minmax(0,1fr)_320px] desk:items-start desk:gap-6">
        <div className="contents desk:flex desk:flex-col desk:gap-4">
          <article className="order-1 desk:order-none bg-white md:rounded-2xl border-y md:border border-slate-200 overflow-hidden">
            <MediaCarousel media={listing.media} title={listing.title} />
            <div className="p-4 md:p-5 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="brand-soft">{listing.transaction === 'vente' ? 'Vente' : 'Location'}</Pill>
                <Pill tone="neutral-soft">{KIND_LABEL[listing.propertyKind] ?? listing.propertyKind}</Pill>
                {listing.sponsored && <span className="text-xs text-slate-400">Sponsorisé</span>}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-navy leading-tight">{listing.title}</h1>
                <p className="text-sm text-slate-500 mt-1">{place} · publié <time dateTime={listing.createdAt}>{timeAgo(listing.createdAt)}</time></p>
              </div>
              <p className="text-2xl font-bold text-brand">{formatPrice(listing.price, listing.priceUnit)}</p>
              {specs.length > 0 && (
                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                  {specs.map(({ icon: Icon, label }) => (
                    <li key={label} className="inline-flex items-center gap-1.5"><Icon className="w-4 h-4 text-slate-400" />{label}</li>
                  ))}
                </ul>
              )}
              {listing.amenities.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Équipements">
                  {listing.amenities.map((a) => <li key={a} className="rounded-full bg-surface px-3 py-1 text-xs text-slate-600">{a}</li>)}
                  {listing.availableNow && <li className="rounded-full bg-trust-50 px-3 py-1 text-xs font-medium text-trust">Disponible maintenant</li>}
                </ul>
              )}
              {isLand && <LandWarning />}
              <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-2 -mx-2">
                <SecondaryAction icon={Heart} label={listing.isFavorite ? 'Enregistré' : 'Enregistrer'} active={listing.isFavorite} onClick={() => onToggleSave(listing)} />
                <SecondaryAction icon={Share2} label="Partager" onClick={() => onShare(listing)} />
                <SecondaryAction icon={Flag} label="Signaler" onClick={onReport} />
              </div>
            </div>
          </article>

          <section aria-labelledby="desc-title" className="order-4 desk:order-none mx-4 md:mx-0 bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
            <h2 id="desc-title" className="font-semibold text-navy mb-2">Description</h2>
            <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{listing.description}</p>
          </section>
        </div>

        <div className="contents desk:flex desk:flex-col desk:gap-4 desk:sticky desk:top-20">
          <div className="order-2 desk:order-none mx-4 md:mx-0">
            <PublisherCard
              listing={listing}
              contact={contact}
              onUnlock={onUnlock}
              reviewAction={review.pending.length > 0 && (
                <button type="button" onClick={() => setReviewOpen(true)} className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-semibold text-brand hover:bg-brand-50">
                  <Star className="w-4 h-4" /> Laisser un avis
                </button>
              )}
            />
          </div>
          <div className="order-3 desk:order-none mx-4 md:mx-0">
            <SafetyNotice isLand={isLand} />
          </div>
          <div className="order-5 desk:order-none mx-4 md:mx-0">
            <DocumentsCard verification={listing.verification} />
          </div>
        </div>
      </div>

      <UnlockContactModal
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        price={listing.contact.price}
        listingTitle={listing.title}
        defaultPhone={user?.phone}
        payment={unlock}
        contact={contact}
      />
      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        subject={listing.publisher}
        interactions={review.pending}
        onSaved={() => { review.refresh(); showToast('Merci pour votre avis !'); }}
      />
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="listing"
        targetId={listing.id}
        onDone={() => showToast('Merci, votre signalement a été transmis')}
      />
      {toastNode}
    </ShellColumns>
  );
}
