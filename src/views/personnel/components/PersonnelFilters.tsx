'use client';

import type { SearchFilters, SearchOptions } from '@/types';
import { Field, SelectInput, ToggleChip } from '@/components/ui/Form';

const SALARY_STEPS = [60000, 100000, 150000, 200000];

interface PersonnelFiltersProps {
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
  options: SearchOptions | null;
  idPrefix: string;
}

/** Filtres rapides M10 : ville, expérience, disponibilité, formation, salaire visé. */
export function PersonnelFilters({ value: f, onChange, options, idPrefix }: PersonnelFiltersProps) {
  const set = (patch: Partial<SearchFilters>) => onChange({ ...f, ...patch });
  const id = (n: string) => `${idPrefix}-${n}`;
  return (
    <div className="flex flex-col gap-3">
      <Field label="Ville" htmlFor={id('city')}>
        <SelectInput id={id('city')} value={f.city ?? ''} onChange={(e) => set({ city: e.target.value || undefined, district: undefined })} className="h-9">
          <option value="">Toutes</option>
          {options?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </SelectInput>
      </Field>
      <Field label="Expérience" htmlFor={id('exp')}>
        <SelectInput id={id('exp')} value={f.experienceMin ?? ''} onChange={(e) => set({ experienceMin: e.target.value ? Number(e.target.value) : undefined })} className="h-9">
          <option value="">Toutes</option>
          <option value="1">1 an et +</option>
          <option value="3">3 ans et +</option>
          <option value="5">5 ans et +</option>
        </SelectInput>
      </Field>
      <Field label="Disponibilité" htmlFor={id('avail')}>
        <SelectInput id={id('avail')} value={f.availability ?? ''} onChange={(e) => set({ availability: (e.target.value || undefined) as SearchFilters['availability'] })} className="h-9">
          <option value="">Toutes</option>
          <option value="immediate">Immédiate</option>
          <option value="sous_15_jours">Sous 15 jours</option>
        </SelectInput>
      </Field>
      <Field label="Salaire visé (budget)" htmlFor={id('salary')} hint="Attente du candidat, jamais une garantie.">
        <SelectInput id={id('salary')} value={f.salaryMax ?? ''} onChange={(e) => set({ salaryMax: e.target.value ? Number(e.target.value) : undefined })} className="h-9">
          <option value="">Tous</option>
          {SALARY_STEPS.map((s) => <option key={s} value={s}>Jusqu&apos;à {s.toLocaleString('fr-FR')} F</option>)}
        </SelectInput>
      </Field>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Formation et vérification">
        <ToggleChip tone="trust" active={!!f.trainedOnly} onClick={() => set({ trainedOnly: !f.trainedOnly })}>Formés</ToggleChip>
        <ToggleChip tone="trust" active={!!f.verifiedOnly} onClick={() => set({ verifiedOnly: !f.verifiedOnly })}>Identité vérifiée</ToggleChip>
      </div>
    </div>
  );
}
