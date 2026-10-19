'use client';

import { FileText, Trash2 } from 'lucide-react';
import { formatShortStamp } from '@/utilis/format';
import type { PublishDraft, Universe } from '@/types';
import { Pill } from '@/components/ui/Pill';
import { ChoiceCard, UniverseDot } from '@/components/ui/ChoiceCard';
import { dataOf } from '../schemas';

export const TYPE_CHOICES: { value: Universe; title: string; description: string; code: string; className: string }[] = [
  { value: 'immobilier', title: 'Bien immobilier', description: 'Maison, appartement, studio, terrain…', code: 'IM', className: 'bg-brand' },
  { value: 'personnel', title: 'Profil personnel', description: 'Chauffeur, ménagère, cuisinier…', code: 'PE', className: 'bg-perso' },
  { value: 'services', title: 'Autre service', description: 'Plomberie, peinture, déménagement…', code: 'SE', className: 'bg-service' },
];

const typeLabel = (t: Universe | null) => TYPE_CHOICES.find((c) => c.value === t)?.title ?? 'Brouillon';

interface TypeStepProps {
  selected: Universe | null;
  onSelect: (type: Universe) => void;
  drafts: PublishDraft[];
  currentDraftId: string;
  onResume: (id: string) => void;
  onDelete: (d: PublishDraft) => void;
  error?: string;
}

export function TypeStep({ selected, onSelect, drafts, currentDraftId, onResume, onDelete, error }: TypeStepProps) {
  const others = drafts.filter((d) => d.id !== currentDraftId);
  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-navy">Que souhaitez-vous publier ?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TYPE_CHOICES.map((c) => (
            <ChoiceCard
              key={c.value}
              name="publish-type"
              value={c.value}
              selected={selected === c.value}
              onSelect={() => onSelect(c.value)}
              title={c.title}
              description={c.description}
              icon={<UniverseDot code={c.code} className={c.className} />}
              badge={<Pill tone="brand" className="self-end">Choisi</Pill>}
            />
          ))}
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      </fieldset>

      {others.length > 0 && (
        <section aria-labelledby="drafts-title">
          <h2 id="drafts-title" className="mb-2 text-sm font-semibold text-navy">Reprendre un brouillon</h2>
          <ul className="flex flex-col gap-2">
            {others.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <button type="button" onClick={() => onResume(d.id)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium text-navy">{(dataOf(d) as { title?: string }).title || typeLabel(d.type)}</span>
                  <span className="block text-xs text-slate-500">{typeLabel(d.type)} · modifié {formatShortStamp(d.updatedAt)}</span>
                </button>
                <button type="button" onClick={() => onDelete(d)} aria-label="Supprimer le brouillon" className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
