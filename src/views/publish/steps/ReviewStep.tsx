'use client';

import { formatAmount, formatPrice } from '@/utilis/format';
import type { FeedItem, PublishDraft, SearchOptions } from '@/types';
import { FeedCard } from '@/views/feed/components/FeedCard';

const label = (list: { value: string; label: string }[] | undefined, v?: string) => list?.find((o) => o.value === v)?.label ?? v ?? '—';

/** Construit l'aperçu "tel qu'il apparaîtra dans le feed". */
function toPreview(d: PublishDraft, options: SearchOptions | null, name: string): FeedItem {
  const base = {
    id: 'preview', createdAt: new Date().toISOString(), isFavorite: false, sponsored: false,
    media: d.media.map(({ url, type }) => ({ url, type })),
  };
  if (d.type === 'immobilier') {
    const l = d.listing;
    return {
      ...base, universe: 'immobilier', title: l.title ?? '', city: l.city ?? '', district: l.district,
      publisher: { id: 'me', name, kind: l.publisherRole === 'agent' ? 'agent' : 'owner', verified: false },
      transaction: l.transaction ?? 'location', propertyKind: l.propertyKind ?? 'appartement',
      price: l.price ?? 0, priceUnit: l.priceUnit ?? 'mois', bedrooms: l.bedrooms, bathrooms: l.bathrooms, surface: l.surface,
      amenities: (l.amenities ?? []).map((a) => label(options?.amenities, a).toLowerCase()), availableNow: !!l.availableNow,
    };
  }
  if (d.type === 'personnel') {
    const c = d.candidate;
    return {
      ...base, universe: 'personnel', title: c.title ?? '', city: c.city ?? '', district: c.district,
      publisher: { id: 'me', name, kind: 'candidate', verified: false },
      job: label(options?.jobs, c.job), jobCode: c.job ?? '', experienceYears: c.experienceYears ?? 0,
      availability: c.availability ?? 'a_convenir', plan: 'gratuit', trained: false,
    };
  }
  const s = d.service;
  return {
    ...base, universe: 'services', title: s.title ?? '', city: s.city ?? '',
    publisher: { id: 'me', name: s.businessName || name, kind: 'provider', verified: false },
    category: s.category ?? '', categoryLabel: label(options?.serviceCategories, s.category),
    summary: (s.description ?? '').slice(0, 140), priceFrom: s.priceFrom, regulated: s.category === 'professionnels_habilites',
  };
}

function Rows({ rows, onEdit }: { rows: [string, string, number][]; onEdit: (step: number) => void }) {
  return (
    <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {rows.map(([k, v, step]) => (
        <div key={k} className="flex items-start gap-3 px-4 py-2.5 text-sm">
          <dt className="w-36 shrink-0 text-slate-500">{k}</dt>
          <dd className="flex-1 text-navy break-words">{v || '—'}</dd>
          <button type="button" onClick={() => onEdit(step)} className="text-xs font-semibold text-brand hover:underline">Modifier</button>
        </div>
      ))}
    </dl>
  );
}

interface ReviewStepProps {
  draft: PublishDraft;
  options: SearchOptions | null;
  userName: string;
  certified: boolean;
  onCertifiedChange: (v: boolean) => void;
  certifyError?: string;
  onEdit: (step: number) => void;
}

/** Étape 5 : aperçu, récapitulatif modifiable, engagement d'exactitude. */
export function ReviewStep({ draft, options, userName, certified, onCertifiedChange, certifyError, onEdit }: ReviewStepProps) {
  const preview = toPreview(draft, options, userName || 'Vous');
  let rows: [string, string, number][] = [];
  if (draft.type === 'immobilier') {
    const l = draft.listing;
    rows = [
      ['Statut', l.publisherRole === 'agent' ? `Agent immobilier${l.agencyName ? ` · ${l.agencyName}` : ''}` : 'Propriétaire / bailleur', 1],
      ['Bien', `${l.transaction === 'vente' ? 'Vente' : 'Location'} · ${label(options?.propertyKinds, l.propertyKind)}`, 2],
      ['Lieu', [l.district, l.city].filter(Boolean).join(', '), 2],
      ['Prix', l.price !== undefined ? formatPrice(l.price, l.priceUnit) : '', 2],
      ['Photos', `${draft.media.length}`, 3],
    ];
  } else if (draft.type === 'personnel') {
    const c = draft.candidate;
    rows = [
      ['Métier', label(options?.jobs, c.job), 1],
      ['Lieu', [c.district, c.city].filter(Boolean).join(', '), 2],
      ['Salaire visé', c.salaryMin || c.salaryMax ? `${c.salaryMin ? formatAmount(c.salaryMin) : '…'} – ${c.salaryMax ? formatAmount(c.salaryMax) : '…'}` : '', 2],
      ['Compétences', (c.skills ?? []).join(', '), 2],
      ['Photo', draft.media.length ? 'Oui' : 'Non', 3],
    ];
  } else {
    const s = draft.service;
    rows = [
      ['Catégorie', label(options?.serviceCategories, s.category), 1],
      ['Structure', s.structure === 'entreprise' ? `Entreprise · ${s.businessName ?? ''}` : 'Indépendant', 1],
      ['Ville', s.city ?? '', 2],
      ['Tarif', s.priceFrom ? `À partir de ${formatAmount(s.priceFrom)}` : '', 2],
      ['Photos', `${draft.media.length}`, 3],
    ];
  }

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="preview-title">
        <h2 id="preview-title" className="mb-2 text-sm font-semibold text-navy">Aperçu dans le feed</h2>
        {/* inert : aperçu non interactif (ni clic, ni tabulation) */}
        <div className="select-none" ref={(el) => el?.setAttribute('inert', '')}>
          <FeedCard item={preview} onToggleSave={() => undefined} onShare={() => undefined} />
        </div>
      </section>
      <section aria-labelledby="recap-title">
        <h2 id="recap-title" className="mb-2 text-sm font-semibold text-navy">Récapitulatif</h2>
        <Rows rows={rows} onEdit={onEdit} />
      </section>
      <div>
        <label className="flex items-start gap-3 text-sm text-navy cursor-pointer">
          <input type="checkbox" checked={certified} onChange={(e) => onCertifiedChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-brand"
            aria-invalid={certifyError ? true : undefined} aria-describedby={certifyError ? 'certify-error' : undefined} />
          <span>
            Je certifie que les informations sont exactes et que je suis autorisé(e) à publier cette offre.
            Je m&apos;engage à ne jamais demander d&apos;avance avant visite ou prestation.
          </span>
        </label>
        {certifyError && <p id="certify-error" role="alert" className="mt-1 text-xs text-red-600">{certifyError}</p>}
      </div>
    </div>
  );
}
