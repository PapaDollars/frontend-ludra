'use client';

import { Info } from 'lucide-react';
import type { CandidateDraftData, ListingDraftData, ServiceDraftData } from '@/types';
import { Field, SelectInput, TextInput, errorProps } from '@/components/ui/Form';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import type { StepProps } from './types';

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{children}</span>
    </p>
  );
}

/** Étape 2 : statut immobilier / métier / catégorie de service. */
export function ProfileStep({ draft, errors, options, onData, onBlur }: StepProps) {
  if (draft.type === 'immobilier') {
    const l: ListingDraftData = draft.listing;
    return (
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-navy">Pour l&apos;immobilier, vous publiez en tant que…</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ChoiceCard name="role" value="owner" selected={l.publisherRole === 'owner'} onSelect={() => onData({ publisherRole: 'owner' })}
              title="Propriétaire / bailleur" description="Vous publiez vos propres biens." />
            <ChoiceCard name="role" value="agent" selected={l.publisherRole === 'agent'} onSelect={() => onData({ publisherRole: 'agent' })}
              title="Agent immobilier" description="Vous publiez des biens avec mandat ou activité professionnelle." />
          </div>
          {errors.publisherRole && <p role="alert" className="mt-2 text-xs text-red-600">{errors.publisherRole}</p>}
        </fieldset>
        {l.publisherRole === 'agent' && (
          <Field label="Agence ou mandant" htmlFor="f-agencyName" error={errors.agencyName} required>
            <TextInput {...errorProps('f-agencyName', errors.agencyName)} value={l.agencyName ?? ''} maxLength={80}
              onChange={(e) => onData({ agencyName: e.target.value || undefined })} onBlur={() => onBlur('agencyName')} />
          </Field>
        )}
        <Note>
          Un même profil peut gérer plusieurs biens et lieux. Pour obtenir le badge « Vérifié », la certification
          {l.publisherRole === 'agent' ? ' (CNI + carte professionnelle ou mandat)' : ' (CNI + justificatif lié au bien)'} vous sera proposée après la publication.
          Vos documents restent privés.
        </Note>
      </div>
    );
  }

  if (draft.type === 'personnel') {
    const c: CandidateDraftData = draft.candidate;
    return (
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold text-navy">Quel métier proposez-vous ?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options?.jobs.map((j) => (
            <ChoiceCard key={j.value} name="job" value={j.value} selected={c.job === j.value} onSelect={() => onData({ job: j.value })} title={j.label} />
          ))}
        </div>
        {errors.job && <p role="alert" className="text-xs text-red-600">{errors.job}</p>}
        <Note>Votre profil est créé gratuitement. Les plans Standard et Premium augmentent la visibilité, jamais le salaire garanti.</Note>
      </fieldset>
    );
  }

  const s: ServiceDraftData = draft.service;
  return (
    <div className="flex flex-col gap-4">
      <Field label="Catégorie de service" htmlFor="f-category" error={errors.category} required>
        <SelectInput {...errorProps('f-category', errors.category)} value={s.category ?? ''}
          onChange={(e) => onData({ category: e.target.value || undefined })} onBlur={() => onBlur('category')}>
          <option value="">Choisir…</option>
          {options?.serviceCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </SelectInput>
      </Field>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-navy">Vous exercez en tant que…</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ChoiceCard name="structure" value="independant" selected={s.structure === 'independant'} onSelect={() => onData({ structure: 'independant' })}
            title="Indépendant" description="Vous travaillez à votre compte." />
          <ChoiceCard name="structure" value="entreprise" selected={s.structure === 'entreprise'} onSelect={() => onData({ structure: 'entreprise' })}
            title="Entreprise" description="Société ou équipe de prestataires." />
        </div>
        {errors.structure && <p role="alert" className="mt-2 text-xs text-red-600">{errors.structure}</p>}
      </fieldset>
      {s.structure === 'entreprise' && (
        <Field label="Nom de l'entreprise" htmlFor="f-businessName" error={errors.businessName} required>
          <TextInput {...errorProps('f-businessName', errors.businessName)} value={s.businessName ?? ''} maxLength={80}
            onChange={(e) => onData({ businessName: e.target.value || undefined })} onBlur={() => onBlur('businessName')} />
        </Field>
      )}
      {s.category === 'professionnels_habilites' && (
        <Note>Professions réglementées (notaire, géomètre…) : votre habilitation sera vérifiée avant affichage du badge. LUDRA oriente, sans conseil juridique.</Note>
      )}
    </div>
  );
}
