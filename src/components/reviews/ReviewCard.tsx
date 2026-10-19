'use client';

import { FormEvent, useState } from 'react';
import { CornerDownRight, Flag, Pencil, Star } from 'lucide-react';

import { cn } from '@/utilis/utils';
import { formatShortStamp } from '@/utilis/format';
import type { InteractionKind, Review } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { TextArea } from '@/components/ui/Form';

const KIND_LABEL: Record<InteractionKind, string> = {
  conversation: 'Après échange',
  contact_unlock: 'Après contact direct',
  visit: 'Après visite',
};

interface ReviewCardProps {
  review: Review;
  subjectName: string;
  onReport: (r: Review) => void;
  onEdit: (r: Review) => void;
  onReply: (r: Review, text: string) => Promise<void>;
}

export function ReviewCard({ review: r, subjectName, onReport, onEdit, onReply }: ReviewCardProps) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 2) return setError('Écrivez votre réponse.');
    setSending(true);
    setError(null);
    try {
      await onReply(r, text.trim());
      setReplying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setSending(false);
    }
  };

  return (
    <article className={cn('rounded-xl border bg-white p-4', r.mine ? 'border-brand-200' : 'border-slate-200')} aria-label={`Avis de ${r.author.name}`}>
      <header className="flex items-start gap-3">
        <UserAvatar name={r.author.name} src={r.author.avatar} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">
            {r.author.name}{r.mine && <span className="ml-1 text-xs font-normal text-brand">(votre avis)</span>}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            <span className="inline-flex" aria-label={`${r.rating} sur 5`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} aria-hidden="true" className={cn('w-3.5 h-3.5', i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')} />
              ))}
            </span>
            <span>{formatShortStamp(r.createdAt)}{r.updatedAt && ' · modifié'}</span>
            <span>· {KIND_LABEL[r.interactionKind]}</span>
          </p>
          {r.context && <p className="text-xs text-slate-400 truncate">{r.context.title}</p>}
        </div>
        <div className="flex gap-1">
          {r.mine ? (
            <button type="button" onClick={() => onEdit(r)} aria-label="Modifier mon avis" className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-surface hover:text-navy">
              <Pencil className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={() => onReport(r)} aria-label={`Signaler l'avis de ${r.author.name}`} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-surface hover:text-red-600">
              <Flag className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {r.comment && <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{r.comment}</p>}

      {r.reply && (
        <div className="mt-3 ml-4 rounded-lg bg-surface px-3 py-2">
          <p className="flex items-center gap-1 text-xs font-semibold text-navy"><CornerDownRight className="w-3.5 h-3.5" /> Réponse de {subjectName}</p>
          <p className="mt-0.5 text-sm text-slate-600">{r.reply.text}</p>
        </div>
      )}

      {r.canReply && !replying && (
        <button type="button" onClick={() => setReplying(true)} className="mt-2 text-xs font-semibold text-brand hover:underline">Répondre publiquement</button>
      )}
      {replying && (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
          <label htmlFor={`reply-${r.id}`} className="text-xs font-medium text-slate-500">Votre réponse (publique, une seule fois)</label>
          <TextArea id={`reply-${r.id}`} value={text} maxLength={500} showCount onChange={(e) => setText(e.target.value)} className="min-h-[80px]" />
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setReplying(false)} className="h-9 px-3 rounded-lg text-sm text-slate-600 hover:bg-surface">Annuler</button>
            <button type="submit" disabled={sending} className="h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-60">{sending ? 'Envoi…' : 'Publier la réponse'}</button>
          </div>
        </form>
      )}
    </article>
  );
}
