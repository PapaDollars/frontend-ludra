import Link from 'next/link';
import { Info, Scale, ShieldCheck } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { formatAmount } from '@/utilis/format';
import type { ServiceCategory, ServiceFeedItem } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Pill } from '@/components/ui/Pill';
import { Rating } from '@/components/ui/Rating';

const TONE: Record<ServiceCategory['tone'], string> = {
  brand: 'bg-brand', service: 'bg-service', caution: 'bg-caution', perso: 'bg-perso', trust: 'bg-trust', navy: 'bg-navy', danger: 'bg-red-600',
};

export function CategoryBadge({ category, size = 'md' }: { category: Pick<ServiceCategory, 'initials' | 'tone'>; size?: 'md' | 'lg' }) {
  return (
    <span aria-hidden="true" className={cn('shrink-0 rounded-full text-white font-bold flex items-center justify-center', TONE[category.tone], size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-[11px]')}>
      {category.initials}
    </span>
  );
}

/** Rappel transverse M14 : aucune prestation garantie par LUDRA. */
export function NotGuaranteedNote({ className }: { className?: string }) {
  return (
    <p className={cn('flex gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-500', className)}>
      <Info className="w-4 h-4 shrink-0 text-brand" />
      <span>Les prestations sont réalisées sous la seule responsabilité des prestataires : LUDRA met en relation mais ne garantit pas le service. Demandez un devis écrit et ne payez pas tout d&apos;avance.</span>
    </p>
  );
}

/** Professions réglementées : orientation uniquement, sans conseil juridique. */
export function RegulatedNote({ className }: { className?: string }) {
  return (
    <p role="note" className={cn('flex gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs text-brand-700', className)}>
      <Scale className="w-4 h-4 shrink-0" />
      <span>
        <strong>Professionnels habilités</strong> (notaires, géomètres…) : répertoire d&apos;orientation. LUDRA ne fournit aucun conseil juridique ;
        l&apos;habilitation affichée est contrôlée sur justificatif, consultez directement le professionnel.
      </span>
    </p>
  );
}

export function ServicesSafetyCard() {
  const tips = ['Demandez un devis écrit', 'Ne payez pas tout d’avance', 'Terrain : vérifiez le titre avec un notaire habilité'];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-navy mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-trust" /> Bien choisir un prestataire</h2>
      <ul className="space-y-2">
        {tips.map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm text-slate-600"><span className="mt-1.5 w-2 h-2 rounded-full bg-trust shrink-0" />{t}</li>
        ))}
      </ul>
    </section>
  );
}

/** Ligne prestataire : même logique de carte et de confiance que le reste de LUDRA. */
export function ProviderRow({ s }: { s: ServiceFeedItem }) {
  return (
    <article aria-label={s.publisher.name} className="flex items-start gap-3 bg-white md:rounded-2xl border-y md:border border-slate-200 p-4">
      <UserAvatar name={s.publisher.name} src={s.publisher.avatar} className="!bg-service-50 !text-service" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={URL.v2.serviceProvider(s.id)} className="font-semibold text-navy hover:underline">{s.publisher.name}</Link>
          {s.publisher.verified && <Pill tone="trust-soft">Vérifié</Pill>}
          {s.regulated && <Pill tone="brand">Professionnel habilité</Pill>}
        </div>
        <p className="text-sm text-slate-600 line-clamp-2">{s.title}</p>
        <p className="text-xs text-slate-500">{[s.district, s.city].filter(Boolean).join(', ')}{s.priceFrom !== undefined && ` · dès ${formatAmount(s.priceFrom)}`}</p>
        <Rating value={s.publisher.rating} count={s.publisher.reviewsCount} className="mt-1" />
      </div>
      <Link href={URL.v2.serviceProvider(s.id)} className="shrink-0 h-8 px-3 inline-flex items-center rounded-lg border border-brand text-brand text-xs font-semibold hover:bg-brand-50">
        Voir
      </Link>
    </article>
  );
}
