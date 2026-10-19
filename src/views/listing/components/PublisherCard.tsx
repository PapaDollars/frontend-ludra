import { ReactNode } from 'react';
import Link from 'next/link';
import { Lock, MessageCircle } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { formatAmount } from '@/utilis/format';
import type { ContactDetails, ListingDetail } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Pill } from '@/components/ui/Pill';
import { Rating } from '@/components/ui/Rating';
import { KIND_LABEL } from '@/views/feed/components/FeedCard';
import { ContactReveal } from './ContactReveal';

interface PublisherCardProps {
  listing: ListingDetail;
  /** Coordonnées si débloquées (paiement confirmé). */
  contact: ContactDetails | null;
  onUnlock: () => void;
  /** Bouton « Laisser un avis » si une interaction est notable. */
  reviewAction?: ReactNode;
}

/** Publieur + contact : message gratuit, contact direct payant (M03/M04). */
export function PublisherCard({ listing, contact, onUnlock, reviewAction }: PublisherCardProps) {
  const { publisher } = listing;

  return (
    <section aria-label="Publieur" className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar name={publisher.name} src={publisher.avatar} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-navy truncate">{publisher.name}</p>
            {publisher.verified && <Pill tone="trust">Vérifié</Pill>}
          </div>
          <p className="text-xs text-slate-500">{KIND_LABEL[publisher.kind][publisher.verified ? 1 : 0]}</p>
          <Link href={URL.v2.reviews(publisher.id)} className="mt-1 inline-flex hover:underline" aria-label={`Voir les avis sur ${publisher.name}`}>
            <Rating value={publisher.rating} count={publisher.reviewsCount} />
          </Link>
        </div>
      </div>

      {listing.viewerIsOwner ? (
        <p className="rounded-lg bg-surface px-3 py-2 text-sm text-slate-600">C&apos;est votre annonce.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <Link
            href={`${URL.v2.messages}?to=${publisher.id}&item=${listing.id}`}
            className="inline-flex items-center justify-center gap-1.5 h-10 rounded-lg border border-brand text-brand text-sm font-semibold hover:bg-brand-50"
          >
            <MessageCircle className="w-4 h-4" /> Message gratuit
          </Link>
          {contact ? (
            <ContactReveal contact={contact} listingTitle={listing.title} />
          ) : (
            <button
              type="button"
              onClick={onUnlock}
              className="inline-flex items-center justify-center gap-1.5 h-10 rounded-lg bg-trust text-white text-sm font-semibold hover:opacity-90"
            >
              <Lock className="w-4 h-4" /> WhatsApp · {formatAmount(listing.contact.price).replace('FCFA', 'F')}
            </button>
          )}
          {reviewAction}
          <p className="text-[11px] text-slate-400 text-center">La messagerie est gratuite. Le téléphone s&apos;affiche après paiement.</p>
        </div>
      )}
    </section>
  );
}
