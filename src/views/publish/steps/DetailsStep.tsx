'use client';

import { KeyboardEvent, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

import { detectContactInfo, hasContactInfo } from '@/lib/messageSafety';
import type { CandidateDraftData, ListingDraftData, ServiceDraftData, SearchOptions } from '@/types';
import {
  Field, FieldGroup, NumberInput, SelectInput, TextArea, TextInput, ToggleChip, errorProps,
} from '@/components/ui/Form';
import type { FieldErrors } from '../schemas';
import type { StepProps } from './types';

const NO_BEDROOMS = ['terrain', 'bureau', 'commerce'];

function ContactWarning({ texts }: { texts: (string | undefined)[] }) {
  if (!texts.some((t) => t && hasContactInfo(detectContactInfo(t)))) return null;
  return (
    <p className="flex gap-2 rounded-lg bg-caution-50 px-3 py-2 text-xs text-amber-900 sm:col-span-2">
      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      N&apos;indiquez ni téléphone, ni e-mail, ni lien dans le texte : ils seront masqués. Le contact passe par la messagerie et le contact direct LUDRA.
    </p>
  );
}

interface CommonProps {
  errors: FieldErrors;
  onData: (patch: Record<string, unknown>) => void;
  onBlur: (field: string) => void;
  options: SearchOptions | null;
}

/** Ville + quartier dépendant. */
function Location({ city, district, errors, onData, onBlur, options }: CommonProps & { city?: string; district?: string }) {
  const districts = options?.cities.find((c) => c.name === city)?.districts ?? [];
  return (
    <>
      <Field label="Ville" htmlFor="f-city" error={errors.city} required>
        <SelectInput {...errorProps('f-city', errors.city)} value={city ?? ''} onBlur={() => onBlur('city')}
          onChange={(e) => onData({ city: e.target.value || undefined, district: undefined })}>
          <option value="">Choisir…</option>
          {options?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </SelectInput>
      </Field>
      <Field label="Quartier" htmlFor="f-district" hint="Le quartier suffit : l'adresse exacte se donne en privé.">
        <SelectInput id="f-district" value={district ?? ''} disabled={!city} onChange={(e) => onData({ district: e.target.value || undefined })}>
          <option value="">{city ? 'Choisir…' : "Choisissez d'abord une ville"}</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </SelectInput>
      </Field>
    </>
  );
}

function ListingDetails({ l, ...p }: CommonProps & { l: ListingDraftData }) {
  const { errors, onData, onBlur, options } = p;
  const toggleAmenity = (code: string) => {
    const cur = l.amenities ?? [];
    onData({ amenities: cur.includes(code) ? cur.filter((a) => a !== code) : [...cur, code] });
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FieldGroup label="Transaction *">
        {(['location', 'vente'] as const).map((t) => (
          <ToggleChip key={t} active={l.transaction === t}
            onClick={() => onData({ transaction: t, priceUnit: t === 'vente' ? 'total' : (l.priceUnit === 'nuit' ? 'nuit' : 'mois') })}>
            {t === 'location' ? 'Location' : 'Vente'}
          </ToggleChip>
        ))}
        {errors.transaction && <p role="alert" className="w-full text-xs text-red-600">{errors.transaction}</p>}
      </FieldGroup>
      <Field label="Type de bien" htmlFor="f-propertyKind" error={errors.propertyKind} required>
        <SelectInput {...errorProps('f-propertyKind', errors.propertyKind)} value={l.propertyKind ?? ''} onBlur={() => onBlur('propertyKind')}
          onChange={(e) => onData({ propertyKind: e.target.value || undefined })}>
          <option value="">Choisir…</option>
          {options?.propertyKinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </SelectInput>
      </Field>
      <Field label="Titre de l'annonce" htmlFor="f-title" error={errors.title} required className="sm:col-span-2" hint="Ex. Appartement 2 chambres lumineux à Bastos">
        <TextInput {...errorProps('f-title', errors.title)} value={l.title ?? ''} maxLength={90}
          onChange={(e) => onData({ title: e.target.value || undefined })} onBlur={() => onBlur('title')} />
      </Field>
      <Field label="Description" htmlFor="f-description" error={errors.description} required className="sm:col-span-2">
        <TextArea {...errorProps('f-description', errors.description)} value={l.description ?? ''} maxLength={3000} showCount
          onChange={(e) => onData({ description: e.target.value || undefined })} onBlur={() => onBlur('description')} />
      </Field>
      <ContactWarning texts={[l.title, l.description]} />
      <Location city={l.city} district={l.district} {...p} />
      <Field label="Prix (FCFA)" htmlFor="f-price" error={errors.price} required>
        <div className="flex gap-2">
          <NumberInput {...errorProps('f-price', errors.price)} step={5000} value={l.price} onValueChange={(v) => onData({ price: v })} onBlur={() => onBlur('price')} />
          {l.transaction !== 'vente' && (
            <SelectInput aria-label="Périodicité" value={l.priceUnit ?? 'mois'} onChange={(e) => onData({ priceUnit: e.target.value })} className="!w-32">
              <option value="mois">/ mois</option>
              <option value="nuit">/ nuit</option>
            </SelectInput>
          )}
        </div>
      </Field>
      <Field label="Surface (m²)" htmlFor="f-surface" error={errors.surface} required={l.propertyKind === 'terrain'}>
        <NumberInput {...errorProps('f-surface', errors.surface)} value={l.surface} onValueChange={(v) => onData({ surface: v })} onBlur={() => onBlur('surface')} />
      </Field>
      {!NO_BEDROOMS.includes(l.propertyKind ?? '') && (
        <>
          <Field label="Chambres" htmlFor="f-bedrooms" error={errors.bedrooms} required>
            <NumberInput {...errorProps('f-bedrooms', errors.bedrooms)} max={50} value={l.bedrooms} onValueChange={(v) => onData({ bedrooms: v })} onBlur={() => onBlur('bedrooms')} />
          </Field>
          <Field label="Douches / salles d'eau" htmlFor="f-bathrooms" error={errors.bathrooms}>
            <NumberInput {...errorProps('f-bathrooms', errors.bathrooms)} max={50} value={l.bathrooms} onValueChange={(v) => onData({ bathrooms: v })} onBlur={() => onBlur('bathrooms')} />
          </Field>
        </>
      )}
      <FieldGroup label="Options" className="sm:col-span-2">
        {options?.amenities.map((a) => (
          <ToggleChip key={a.value} active={!!l.amenities?.includes(a.value)} onClick={() => toggleAmenity(a.value)}>{a.label}</ToggleChip>
        ))}
        <ToggleChip tone="trust" active={!!l.availableNow} onClick={() => onData({ availableNow: !l.availableNow })}>Disponible maintenant</ToggleChip>
      </FieldGroup>
    </div>
  );
}

function SkillsInput({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const s = draft.trim().slice(0, 30);
    if (s && !value.includes(s) && value.length < 10) onChange([...value, s]);
    setDraft('');
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
  };
  return (
    <Field label="Compétences (10 max.)" htmlFor="f-skills" error={error} hint="Entrée pour ajouter. Ex. Conduite urbaine, Ponctualité" className="sm:col-span-2">
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {value.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-full bg-perso-50 px-3 py-1 text-xs font-medium text-perso">
            {s}
            <button type="button" aria-label={`Retirer ${s}`} onClick={() => onChange(value.filter((x) => x !== s))}><X className="w-3 h-3" /></button>
          </span>
        ))}
        <input id="f-skills" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} onBlur={add}
          disabled={value.length >= 10} className="flex-1 min-w-[140px] text-sm outline-none" placeholder={value.length ? '' : 'Ajouter une compétence'} />
      </div>
    </Field>
  );
}

function CandidateDetails({ c, ...p }: CommonProps & { c: CandidateDraftData }) {
  const { errors, onData, onBlur } = p;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Titre du profil" htmlFor="f-title" error={errors.title} required className="sm:col-span-2" hint="Ex. Chauffeur expérimenté, permis B">
        <TextInput {...errorProps('f-title', errors.title)} value={c.title ?? ''} maxLength={90}
          onChange={(e) => onData({ title: e.target.value || undefined })} onBlur={() => onBlur('title')} />
      </Field>
      <Field label="Présentation" htmlFor="f-summary" error={errors.summary} required className="sm:col-span-2"
        hint="Parlez de votre expérience et de vos qualités. Aucune information personnelle sensible (religion, ethnie, santé…).">
        <TextArea {...errorProps('f-summary', errors.summary)} value={c.summary ?? ''} maxLength={1500} showCount
          onChange={(e) => onData({ summary: e.target.value || undefined })} onBlur={() => onBlur('summary')} />
      </Field>
      <ContactWarning texts={[c.title, c.summary, c.training]} />
      <Location city={c.city} district={c.district} {...p} />
      <Field label="Années d'expérience" htmlFor="f-experienceYears" error={errors.experienceYears} required>
        <NumberInput {...errorProps('f-experienceYears', errors.experienceYears)} max={60} value={c.experienceYears}
          onValueChange={(v) => onData({ experienceYears: v })} onBlur={() => onBlur('experienceYears')} />
      </Field>
      <Field label="Disponibilité" htmlFor="f-availability" error={errors.availability} required>
        <SelectInput {...errorProps('f-availability', errors.availability)} value={c.availability ?? ''} onBlur={() => onBlur('availability')}
          onChange={(e) => onData({ availability: e.target.value || undefined })}>
          <option value="">Choisir…</option>
          <option value="immediate">Immédiate</option>
          <option value="sous_15_jours">Sous 15 jours</option>
          <option value="a_convenir">À convenir</option>
        </SelectInput>
      </Field>
      <Field label="Salaire visé (FCFA / mois)" htmlFor="f-salaryMin" error={errors.salaryMin ?? errors.salaryMax} className="sm:col-span-2"
        hint="Critère de ciblage uniquement : ce n'est jamais une garantie de salaire.">
        <div className="flex items-center gap-2">
          <NumberInput {...errorProps('f-salaryMin', errors.salaryMin)} aria-label="Salaire minimum" placeholder="Min" step={5000}
            value={c.salaryMin} onValueChange={(v) => onData({ salaryMin: v })} onBlur={() => onBlur('salaryMin')} />
          <span className="text-slate-400">–</span>
          <NumberInput aria-label="Salaire maximum" placeholder="Max" step={5000} aria-invalid={errors.salaryMax ? true : undefined}
            value={c.salaryMax} onValueChange={(v) => onData({ salaryMax: v })} onBlur={() => onBlur('salaryMax')} />
        </div>
      </Field>
      <SkillsInput value={c.skills ?? []} onChange={(skills) => onData({ skills })} error={errors.skills} />
      <Field label="Formation / permis" htmlFor="f-training" error={errors.training} className="sm:col-span-2" hint="Le badge « Formé » est attribué sur preuve, après vérification.">
        <TextInput {...errorProps('f-training', errors.training)} value={c.training ?? ''} maxLength={300}
          onChange={(e) => onData({ training: e.target.value || undefined })} onBlur={() => onBlur('training')} />
      </Field>
    </div>
  );
}

function ServiceDetails({ s, ...p }: CommonProps & { s: ServiceDraftData }) {
  const { errors, onData, onBlur } = p;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Titre" htmlFor="f-title" error={errors.title} required className="sm:col-span-2" hint="Ex. Plombier — fuites et installations sanitaires">
        <TextInput {...errorProps('f-title', errors.title)} value={s.title ?? ''} maxLength={90}
          onChange={(e) => onData({ title: e.target.value || undefined })} onBlur={() => onBlur('title')} />
      </Field>
      <Field label="Description de vos prestations" htmlFor="f-description" error={errors.description} required className="sm:col-span-2">
        <TextArea {...errorProps('f-description', errors.description)} value={s.description ?? ''} maxLength={2000} showCount
          onChange={(e) => onData({ description: e.target.value || undefined })} onBlur={() => onBlur('description')} />
      </Field>
      <ContactWarning texts={[s.title, s.description]} />
      <Field label="Ville" htmlFor="f-city" error={errors.city} required>
        <SelectInput {...errorProps('f-city', errors.city)} value={s.city ?? ''} onBlur={() => onBlur('city')}
          onChange={(e) => onData({ city: e.target.value || undefined })}>
          <option value="">Choisir…</option>
          {p.options?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </SelectInput>
      </Field>
      <Field label="Tarif à partir de (FCFA)" htmlFor="f-priceFrom" error={errors.priceFrom} hint="Facultatif">
        <NumberInput {...errorProps('f-priceFrom', errors.priceFrom)} step={1000} value={s.priceFrom}
          onValueChange={(v) => onData({ priceFrom: v })} onBlur={() => onBlur('priceFrom')} />
      </Field>
    </div>
  );
}

/** Étape 3 : détails propres au type. */
export function DetailsStep({ draft, ...p }: StepProps) {
  if (draft.type === 'immobilier') return <ListingDetails l={draft.listing} {...p} />;
  if (draft.type === 'personnel') return <CandidateDetails c={draft.candidate} {...p} />;
  return <ServiceDetails s={draft.service} {...p} />;
}
