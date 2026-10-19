'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Building2, Heart, Lightbulb, MessageCircle, Share2, Wrench } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { formatAmount, formatPrice, timeAgo } from '@/utilis/format';
import type { CandidateFeedItem, FeedItem, ListingFeedItem, PublisherKind, ServiceFeedItem } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Pill } from '@/components/ui/Pill';

export const KIND_LABEL: Record<PublisherKind, [string, string]> = {
  // [non vérifié, vérifié]
  owner: ['Propriétaire', 'Propriétaire vérifié(e)'],
  agent: ['Agent immobilier', 'Agent vérifié'],
  candidate: ['Candidat', 'Candidat vérifié'],
  recruiter: ['Recruteur', 'Recruteur vérifié'],
  provider: ['Prestataire', 'Prestataire vérifié'],
  user: ['Membre', 'Membre vérifié'],
};

const AVAILABILITY: Record<CandidateFeedItem['availability'], string> = {
  immediate: 'Disponible immédiatement',
  sous_15_jours: 'Disponible sous 15 jours',
  a_convenir: 'Disponibilité à convenir',
};

const PLAN_TONE = { premium: 'perso', standard: 'brand', gratuit: 'neutral-soft' } as const;

export const itemHref = (item: FeedItem) => {
  switch (item.universe) {
    case 'immobilier': return URL.v2.listing(item.id);
    case 'personnel': return URL.v2.candidate(item.id);
    case 'services': return URL.v2.serviceProvider(item.id);
  }
};

function MediaPlaceholder({ universe }: { universe: FeedItem['universe'] }) {
  const Icon = universe === 'immobilier' ? Building2 : universe === 'personnel' ? Briefcase : Wrench;
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-brand-50 to-slate-100">
      <Icon className="w-12 h-12 text-brand-200" />
    </div>
  );
}

function CardMedia({ item, href }: { item: FeedItem; href: string }) {
  const [failed, setFailed] = useState(false);
  const media = item.media[0];
  return (
    <Link href={href} className="block relative aspect-[16/10] max-h-[420px] w-full bg-slate-100 overflow-hidden" tabIndex={-1}>
      {media && !failed ? (
        <img src={media.url} alt={media.alt || item.title} loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <MediaPlaceholder universe={item.universe} />
      )}
    </Link>
  );
}

function ListingBody({ item }: { item: ListingFeedItem }) {
  const attrs = [
    item.bedrooms !== undefined && `${item.bedrooms} chambre${item.bedrooms > 1 ? 's' : ''}`,
    item.bathrooms !== undefined && `${item.bathrooms} douche${item.bathrooms > 1 ? 's' : ''}`,
    item.surface !== undefined && `${item.surface} m²`,
    ...item.amenities,
  ].filter(Boolean) as string[];

  return (
    <>
      <p className="text-lg font-bold text-brand">{formatPrice(item.price, item.priceUnit)}</p>
      {attrs.length > 0 && <p className="text-sm text-slate-500">{attrs.join(' • ')}</p>}
    </>
  );
}

function CandidateBody({ item }: { item: CandidateFeedItem }) {
  return (
    <>
      <p className="text-sm text-slate-600">
        {item.job} · {item.experienceYears} an{item.experienceYears > 1 ? 's' : ''} d&apos;expérience · {AVAILABILITY[item.availability]}
      </p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {item.plan !== 'gratuit' && <Pill tone={PLAN_TONE[item.plan]}>{item.plan}</Pill>}
        {item.trained && <Pill tone="trust-soft">Formé</Pill>}
      </div>
    </>
  );
}

function ServiceBody({ item }: { item: ServiceFeedItem }) {
  return (
    <>
      <p className="text-sm text-slate-600">{item.summary}</p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Pill tone="service-soft">{item.categoryLabel}</Pill>
        {item.regulated && <Pill tone="neutral-soft">Professionnel habilité</Pill>}
        {item.priceFrom !== undefined && <span className="text-sm font-semibold text-navy">À partir de {formatAmount(item.priceFrom)}</span>}
      </div>
    </>
  );
}

function ActionButton({ icon: Icon, label, onClick, active, className }: {
  icon: typeof Heart; label: string; onClick?: () => void; active?: boolean; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium transition-colors',
        active ? 'text-brand' : 'text-slate-600 hover:bg-surface hover:text-navy',
        className,
      )}
    >
      <Icon className={cn('w-4 h-4', active && 'fill-current')} />
      {label}
    </button>
  );
}

interface FeedCardProps {
  item: FeedItem;
  onToggleSave: (item: FeedItem) => void;
  onShare: (item: FeedItem) => void;
}

/**
 * Carte standard du feed (M01) : auteur, badge, lieu, média, prix, attributs, actions.
 * Même carte et mêmes actions essentielles sur desktop et mobile.
 */
export const FeedCard = memo(({ item, onToggleSave, onShare }: FeedCardProps) => {
  const href = itemHref(item);
  const { publisher } = item;
  const place = [item.district, item.city].filter(Boolean).join(', ');
  const isListing = item.universe === 'immobilier';
  const showMedia = item.media.length > 0 || isListing;

  return (
    <article className="bg-white md:rounded-2xl border-y md:border border-slate-200 overflow-hidden">
      {/* En-tête auteur */}
      <header className="flex items-start gap-3 p-4">
        <UserAvatar name={publisher.name} src={publisher.avatar} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy truncate">
            {publisher.name} <span className="font-normal text-slate-500">· {KIND_LABEL[publisher.kind][publisher.verified ? 1 : 0]}</span>
          </p>
          <p className="text-xs text-slate-500 truncate">
            {place} · <time dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {publisher.verified && <Pill tone="trust">Vérifié</Pill>}
          {item.sponsored && <span className="text-[11px] text-slate-400">Sponsorisé</span>}
        </div>
      </header>

      {showMedia && <CardMedia item={item} href={href} />}

      <div className="p-4 space-y-1">
        <h3 className="font-semibold text-navy leading-snug">
          <Link href={href} className="hover:underline">{item.title}</Link>
        </h3>
        {item.universe === 'immobilier' && <ListingBody item={item} />}
        {item.universe === 'personnel' && <CandidateBody item={item} />}
        {item.universe === 'services' && <ServiceBody item={item} />}
      </div>

      {/* Actions */}
      <footer className="px-2 pb-2 md:px-4 md:pb-3">
        <div className="flex items-center gap-1 md:gap-2 border-t border-slate-100 pt-2">
          <ActionButton icon={Heart} label={item.isFavorite ? 'Enregistré' : 'Enregistrer'} active={item.isFavorite} onClick={() => onToggleSave(item)} />
          <ActionButton icon={Share2} label="Partager" onClick={() => onShare(item)} className="hidden sm:inline-flex" />
          <div className="flex-1 flex justify-end gap-2">
            <Link
              href={`${URL.v2.messages}?to=${publisher.id}&item=${item.id}`}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-brand text-brand text-sm font-semibold hover:bg-brand-50"
            >
              <MessageCircle className="w-4 h-4" /> Message
            </Link>
            {isListing && (
              // Contact direct payant (M04) : le numéro n'est jamais dans le feed.
              <Link
                href={`${href}?contact=1`}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-trust text-white text-sm font-semibold hover:opacity-90"
              >
                WhatsApp
              </Link>
            )}
          </div>
        </div>
        {isListing && (
          <p className="md:hidden mt-2 flex items-center gap-1.5 rounded-lg bg-caution-50 px-3 py-2 text-xs text-caution">
            <Lightbulb className="w-3.5 h-3.5 shrink-0" /> Conseil : visitez le bien avant tout paiement.
          </p>
        )}
      </footer>
    </article>
  );
});

FeedCard.displayName = 'FeedCard';
