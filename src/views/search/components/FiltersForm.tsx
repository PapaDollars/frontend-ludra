'use client';

import type { CandidateFeedItem, SearchFilters, SearchOptions } from '@/types';
import { Field, FieldGroup, NumberInput, SelectInput, ToggleChip } from '@/components/ui/Form';

interface FiltersFormProps {
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
  options: SearchOptions | null;
  /** Préfixe des id (le formulaire existe en version desktop et bottom sheet). */
  idPrefix: string;
}

const BEDROOMS = [1, 2, 3, 4];
const EXPERIENCE = [1, 2, 5];
const AVAILABILITY: { value: CandidateFeedItem['availability']; label: string }[] = [
  { value: 'immediate', label: 'Immédiate' },
  { value: 'sous_15_jours', label: 'Sous 15 jours' },
];

/** Panneau de filtres propre à chaque univers (M02, M10, M14). */
export function FiltersForm({ value: f, onChange, options, idPrefix }: FiltersFormProps) {
  const set = (patch: Partial<SearchFilters>) => onChange({ ...f, ...patch });
  const id = (name: string) => `${idPrefix}-${name}`;
  const districts = options?.cities.find((c) => c.name === f.city)?.districts ?? [];

  const toggleAmenity = (code: string) => {
    const current = f.amenities ?? [];
    set({ amenities: current.includes(code) ? current.filter((a) => a !== code) : [...current, code] });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
      {/* ── Communs ── */}
      <Field label="Ville" htmlFor={id('city')}>
        <SelectInput id={id('city')} value={f.city ?? ''} onChange={(e) => set({ city: e.target.value || undefined, district: undefined })}>
          <option value="">Toutes les villes</option>
          {options?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </SelectInput>
      </Field>
      <Field label="Quartier" htmlFor={id('district')}>
        <SelectInput id={id('district')} value={f.district ?? ''} disabled={!f.city} onChange={(e) => set({ district: e.target.value || undefined })}>
          <option value="">{f.city ? 'Tous les quartiers' : "Choisissez d'abord une ville"}</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </SelectInput>
      </Field>

      {f.universe === 'immobilier' && (
        <>
          <Field label="Transaction" htmlFor={id('transaction')}>
            <SelectInput id={id('transaction')} value={f.transaction ?? ''} onChange={(e) => set({ transaction: (e.target.value || undefined) as SearchFilters['transaction'] })}>
              <option value="">Location ou vente</option>
              <option value="location">Location</option>
              <option value="vente">Vente</option>
            </SelectInput>
          </Field>
          <Field label="Type de bien" htmlFor={id('kind')}>
            <SelectInput id={id('kind')} value={f.propertyKind ?? ''} onChange={(e) => set({ propertyKind: (e.target.value || undefined) as SearchFilters['propertyKind'] })}>
              <option value="">Tous les types</option>
              {options?.propertyKinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Budget (FCFA)" htmlFor={id('budget-min')}>
            <div className="flex items-center gap-2">
              <NumberInput id={id('budget-min')} aria-label="Budget minimum" placeholder="Min" step={5000} value={f.budgetMin} onValueChange={(v) => set({ budgetMin: v })} />
              <span className="text-slate-400">–</span>
              <NumberInput aria-label="Budget maximum" placeholder="Max" step={5000} value={f.budgetMax} onValueChange={(v) => set({ budgetMax: v })} />
            </div>
          </Field>
          <Field label="Surface minimale (m²)" htmlFor={id('surface')}>
            <NumberInput id={id('surface')} placeholder="Ex. 80" step={10} value={f.surfaceMin} onValueChange={(v) => set({ surfaceMin: v })} />
          </Field>
          <FieldGroup label="Chambres" className="sm:col-span-2">
            {BEDROOMS.map((n) => (
              <ToggleChip key={n} active={f.bedroomsMin === n} onClick={() => set({ bedroomsMin: f.bedroomsMin === n ? undefined : n })}>
                {n}+
              </ToggleChip>
            ))}
          </FieldGroup>
          <FieldGroup label="Options" className="sm:col-span-2">
            {options?.amenities.map((a) => (
              <ToggleChip key={a.value} active={!!f.amenities?.includes(a.value)} onClick={() => toggleAmenity(a.value)}>
                {a.label}
              </ToggleChip>
            ))}
            <ToggleChip tone="trust" active={!!f.availableNow} onClick={() => set({ availableNow: !f.availableNow })}>
              Disponible maintenant
            </ToggleChip>
          </FieldGroup>
        </>
      )}

      {f.universe === 'personnel' && (
        <>
          <Field label="Métier" htmlFor={id('job')}>
            <SelectInput id={id('job')} value={f.job ?? ''} onChange={(e) => set({ job: e.target.value || undefined })}>
              <option value="">Tous les métiers</option>
              {options?.jobs.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Disponibilité" htmlFor={id('availability')}>
            <SelectInput id={id('availability')} value={f.availability ?? ''} onChange={(e) => set({ availability: (e.target.value || undefined) as SearchFilters['availability'] })}>
              <option value="">Peu importe</option>
              {AVAILABILITY.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </SelectInput>
          </Field>
          <FieldGroup label="Expérience minimale" className="sm:col-span-2">
            {EXPERIENCE.map((n) => (
              <ToggleChip key={n} active={f.experienceMin === n} onClick={() => set({ experienceMin: f.experienceMin === n ? undefined : n })}>
                {n} an{n > 1 ? 's' : ''}+
              </ToggleChip>
            ))}
            <ToggleChip tone="trust" active={!!f.trainedOnly} onClick={() => set({ trainedOnly: !f.trainedOnly })}>
              Formés uniquement
            </ToggleChip>
          </FieldGroup>
        </>
      )}

      {f.universe === 'services' && (
        <Field label="Catégorie" htmlFor={id('category')} className="sm:col-span-2">
          <SelectInput id={id('category')} value={f.category ?? ''} onChange={(e) => set({ category: e.target.value || undefined })}>
            <option value="">Toutes les catégories</option>
            {options?.serviceCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </SelectInput>
        </Field>
      )}

      <FieldGroup label="Compte" className="sm:col-span-2">
        <ToggleChip tone="trust" active={!!f.verifiedOnly} onClick={() => set({ verifiedOnly: !f.verifiedOnly })}>
          Vérifié uniquement
        </ToggleChip>
      </FieldGroup>
    </div>
  );
}
