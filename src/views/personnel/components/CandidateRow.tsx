import { ReactNode } from 'react';
import Link from 'next/link';
import URL from '@/utilis/url/url_front';
import type { CandidateFeedItem, CandidatePlan } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Pill } from '@/components/ui/Pill';
import { Rating } from '@/components/ui/Rating';

const PLAN_PILL: Record<CandidatePlan, { tone: 'perso' | 'brand' | 'neutral'; label: string }> = {
  premium: { tone: 'perso', label: 'Premium' },
  standard: { tone: 'brand', label: 'Standard' },
  gratuit: { tone: 'neutral', label: 'Basique' },
};

export const CandidatePlanPill = ({ plan }: { plan: CandidatePlan }) => (
  <Pill tone={PLAN_PILL[plan].tone}>{PLAN_PILL[plan].label}</Pill>
);

const AVAILABILITY = { immediate: 'disponible', sous_15_jours: 'sous 15 jours', a_convenir: 'à convenir' } as const;

/** Ligne candidat (M10) : identité, métier, expérience, ville, note, niveau de visibilité. */
export function CandidateRow({ c, actions }: { c: CandidateFeedItem; actions?: ReactNode }) {
  return (
    <article aria-label={`${c.publisher.name}, ${c.job}`} className="flex items-start gap-3 bg-white md:rounded-2xl border-y md:border border-slate-200 p-4">
      <UserAvatar name={c.publisher.name} src={c.publisher.avatar} size="md" className="!bg-perso-50 !text-perso" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={URL.v2.candidate(c.id)} className="font-semibold text-navy hover:underline">{c.publisher.name}</Link>
          {c.publisher.verified && <Pill tone="trust-soft">Identité vérifiée</Pill>}
          {c.trained && <Pill tone="trust">Formé</Pill>}
        </div>
        <p className="text-sm text-slate-600">{c.job}</p>
        <p className="text-xs text-slate-500">
          {c.experienceYears} an{c.experienceYears > 1 ? 's' : ''} · {c.city} · {AVAILABILITY[c.availability]}
        </p>
        <Rating value={c.publisher.rating} count={c.publisher.reviewsCount} className="mt-1" />
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <CandidatePlanPill plan={c.plan} />
        {actions ?? (
          <Link href={URL.v2.candidate(c.id)} className="h-8 px-3 inline-flex items-center rounded-lg border border-brand text-brand text-xs font-semibold hover:bg-brand-50">
            Voir le profil
          </Link>
        )}
      </div>
    </article>
  );
}
