'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';

import { cn } from '@/utilis/utils';
import { IMAGE_TYPES } from '@/lib/messageSafety';
import { publishService } from '@/services/publish.service';
import type { PublishDraft, UploadedMedia } from '@/types';
import { MEDIA_RULES } from '../schemas';

const MAX_BYTES = 10 * 1024 * 1024;

interface MediaStepProps {
  draft: PublishDraft;
  error?: string;
  onChange: (media: UploadedMedia[]) => void;
}

/** Étape 4 : photos téléversées immédiatement (le brouillon ne garde que les id/url). */
export function MediaStep({ draft, error, onChange }: MediaStepProps) {
  const rules = MEDIA_RULES[draft.type!];
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const mediaRef = useRef(draft.media);
  mediaRef.current = draft.media;

  const remaining = rules.max - draft.media.length - uploading;

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    setUploadError(null);
    const accepted = files.filter((f) => IMAGE_TYPES.includes(f.type) && f.size <= MAX_BYTES).slice(0, Math.max(0, remaining));
    if (accepted.length < files.length) {
      setUploadError(`Certaines images ont été ignorées (JPG/PNG/WebP, 10 Mo max., ${rules.max} photo${rules.max > 1 ? 's' : ''} au total).`);
    }
    setUploading((n) => n + accepted.length);
    await Promise.all(accepted.map(async (file) => {
      try {
        const uploaded = await publishService.upload(file);
        onChange([...mediaRef.current, uploaded]);
        mediaRef.current = [...mediaRef.current, uploaded];
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Échec du téléversement.');
      } finally {
        setUploading((n) => n - 1);
      }
    }));
  };

  const move = (i: number, to: number) => {
    const next = [...draft.media];
    const [m] = next.splice(i, 1);
    next.splice(to, 0, m);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">{rules.label}</p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3" aria-label="Photos">
        {draft.media.map((m, i) => (
          <li key={m.id} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img src={m.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && rules.max > 1 && (
              <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase text-white">Couverture</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5">
              <div className="flex gap-1">
                {i > 0 && (
                  <button type="button" onClick={() => move(i, i - 1)} aria-label="Déplacer avant" className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
                )}
                {i < draft.media.length - 1 && (
                  <button type="button" onClick={() => move(i, i + 1)} aria-label="Déplacer après" className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
                )}
                {i > 0 && rules.max > 1 && (
                  <button type="button" onClick={() => move(i, 0)} aria-label="Définir comme couverture" className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center"><Star className="w-3.5 h-3.5" /></button>
                )}
              </div>
              <button type="button" onClick={() => onChange(draft.media.filter((x) => x.id !== m.id))} aria-label={`Supprimer la photo ${i + 1}`}
                className="w-7 h-7 rounded-full bg-white/90 text-red-600 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </li>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <li key={`up-${i}`} className="aspect-[4/3] rounded-xl border border-dashed border-slate-300 bg-surface flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand" aria-label="Téléversement en cours" />
          </li>
        ))}
        {remaining > 0 && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className={cn(
                'aspect-[4/3] w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-sm font-medium transition',
                error ? 'border-red-300 text-red-600' : 'border-slate-300 text-slate-500 hover:border-brand hover:text-brand',
              )}
            >
              <ImagePlus className="w-6 h-6" />
              Ajouter
              <span className="text-[11px] font-normal">{remaining} restante{remaining > 1 ? 's' : ''}</span>
            </button>
          </li>
        )}
      </ul>
      <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} multiple={rules.max > 1} onChange={onPick} className="hidden" />
      {(error || uploadError) && <p role="alert" className="text-xs text-red-600">{uploadError ?? error}</p>}
      <p className="text-[11px] text-slate-400">N&apos;ajoutez pas de photo de document d&apos;identité : la certification se fait dans un espace privé.</p>
    </div>
  );
}
