'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

import { formatShortStamp } from '@/utilis/format';
import { detectContactInfo, hasContactInfo } from '@/lib/messageSafety';
import { reviewService } from '@/services/review.service';
import type { Publisher, Review, ReviewableInteraction, StarRating } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Field, SelectInput, TextArea } from '@/components/ui/Form';
import { StarInput } from './StarInput';

const KIND = { conversation: 'échange', contact_unlock: 'contact direct', visit: 'visite' } as const;

const interactionLabel = (i: ReviewableInteraction) =>
  `${i.context?.title ?? 'Échange'} · ${KIND[i.kind]} · ${formatShortStamp(i.at)}`;

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Publisher;
  /** Interactions notables non encore évaluées (création). */
  interactions: ReviewableInteraction[];
  /** Avis existant (modification). */
  editing?: Review | null;
  onSaved: (r: Review) => void;
}

/** M09 — « Évaluer votre expérience » : 1–5 étoiles + commentaire facultatif. */
export function ReviewDialog({ open, onOpenChange, subject, interactions, editing, onSaved }: ReviewDialogProps) {
  const [interactionId, setInteractionId] = useState('');
  const [rating, setRating] = useState<StarRating | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInteractionId(interactions[0]?.id ?? '');
    setRating(editing?.rating ?? null);
    setComment(editing?.comment ?? '');
    setError(null);
    setRatingError(undefined);
  }, [open, editing, interactions]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) return setRatingError('Choisissez une note de 1 à 5.');
    setSaving(true);
    setError(null);
    try {
      const saved = editing
        ? await reviewService.update(editing.id, { rating, comment: comment.trim() || undefined })
        : await reviewService.create({ interactionId, rating, comment: comment.trim() || undefined });
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Évaluer votre expérience"
      description="Avis autorisé après interaction vérifiable"
      footer={
        <button form="review-form" type="submit" disabled={saving} className="w-full h-11 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
          {saving ? 'Envoi…' : editing ? 'Mettre à jour mon avis' : 'Publier mon avis'}
        </button>
      }
    >
      <form id="review-form" onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-1">
          <UserAvatar name={subject.name} src={subject.avatar} size="lg" />
          <p className="font-semibold text-navy">{subject.name}</p>
        </div>

        {!editing && interactions.length > 1 && (
          <Field label="Interaction évaluée" htmlFor="review-interaction">
            <SelectInput id="review-interaction" value={interactionId} onChange={(e) => setInteractionId(e.target.value)}>
              {interactions.map((i) => <option key={i.id} value={i.id}>{interactionLabel(i)}</option>)}
            </SelectInput>
          </Field>
        )}
        {!editing && interactions.length === 1 && <p className="text-center text-xs text-slate-500">{interactionLabel(interactions[0])}</p>}

        <StarInput value={rating} onChange={(v) => { setRating(v); setRatingError(undefined); }} error={ratingError} />

        <Field label="Votre commentaire (facultatif)" htmlFor="review-comment" hint="Restez factuel et courtois. Les avis injurieux sont retirés par la modération.">
          <TextArea id="review-comment" value={comment} maxLength={1000} showCount onChange={(e) => setComment(e.target.value)} className="min-h-[90px]" placeholder="Ponctuel, visite organisée et informations claires." />
        </Field>
        {hasContactInfo(detectContactInfo(comment)) && (
          <p className="flex gap-2 rounded-lg bg-caution-50 px-3 py-2 text-xs text-amber-900">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Les numéros, e-mails et liens seront masqués.
          </p>
        )}
        {editing && <p className="text-[11px] text-slate-400 text-center">Un seul avis par interaction : vous modifiez votre avis existant. Seule la modération peut supprimer un avis.</p>}
        {error && <p role="alert" className="text-sm text-red-600 text-center">{error}</p>}
      </form>
    </Modal>
  );
}
