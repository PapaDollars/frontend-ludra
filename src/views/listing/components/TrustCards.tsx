import Link from 'next/link';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import URL from '@/utilis/url/url_front';
import type { ListingVerification } from '@/types';
import { Pill } from '@/components/ui/Pill';

const NOTARY_SEARCH = URL.v2.serviceCategory('professionnels_habilites');

/** "Avant de payer" — rappels anti-arnaque (M03), renforcés pour les terrains. */
export function SafetyNotice({ isLand }: { isLand: boolean }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-caution-50 p-4">
      <h2 className="flex items-center gap-2 font-semibold text-caution mb-2">
        <AlertTriangle className="w-4 h-4" /> Avant de payer
      </h2>
      <ul className="space-y-1.5 text-sm text-amber-900">
        <li className="flex gap-2"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-caution shrink-0" />Visitez le bien.</li>
        <li className="flex gap-2"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-caution shrink-0" />Ne payez pas une « avance de visite ».</li>
        <li className={isLand ? 'flex gap-2 font-semibold' : 'flex gap-2'}>
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-caution shrink-0" />
          <span>
            Terrain : vérifiez le titre foncier avec un{' '}
            <Link href={NOTARY_SEARCH} className="underline font-medium">notaire / professionnel habilité</Link>.
          </span>
        </li>
      </ul>
    </section>
  );
}

/** Avertissement renforcé affiché en tête de fiche pour un terrain (critère d'acceptation M03). */
export function LandWarning() {
  return (
    <div role="note" className="flex gap-3 rounded-xl border border-amber-300 bg-caution-50 p-4 text-sm text-amber-900">
      <AlertTriangle className="w-5 h-5 text-caution shrink-0 mt-0.5" />
      <p>
        <strong>Terrain : vérifiez le titre foncier avant tout versement.</strong> Exigez une copie du titre et faites-la contrôler
        par un notaire ou un géomètre habilité. LUDRA ne garantit pas la transaction et ne donne pas de conseil juridique.{' '}
        <Link href={NOTARY_SEARCH} className="underline font-medium">Trouver un professionnel habilité</Link>
      </p>
    </div>
  );
}

/** Statuts des contrôles internes — les documents eux-mêmes ne sont jamais publics. */
export function DocumentsCard({ verification }: { verification: ListingVerification }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="flex items-center gap-2 font-semibold text-navy mb-1">
        <ShieldCheck className="w-4 h-4 text-brand" /> Documents du bien
      </h2>
      <p className="text-xs text-slate-500 mb-3">Statut : contrôles internes LUDRA</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <Pill tone={verification.identityVerified ? 'trust' : 'neutral-soft'}>
          {verification.identityVerified ? 'Identité OK' : 'Identité non vérifiée'}
        </Pill>
        <Pill tone={verification.propertyDocumented ? 'brand' : 'neutral-soft'}>
          {verification.propertyDocumented ? 'Bien documenté' : 'Bien non documenté'}
        </Pill>
      </div>
      <p className="text-xs text-slate-400">Les documents privés ne sont jamais publics.</p>
    </section>
  );
}
