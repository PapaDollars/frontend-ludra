'use client';

import { FormEvent, useEffect, useState } from 'react';
import { cn } from '@/utilis/utils';
import { reportService } from '@/services/report.service';
import type { ReportReason, ReportTargetType } from '@/types';
import { Modal } from '@/components/ui/Modal';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'arnaque', label: 'Arnaque ou demande d’avance' },
  { value: 'fausse_annonce', label: 'Fausse annonce / photos trompeuses' },
  { value: 'deja_loue', label: 'Déjà loué ou vendu' },
  { value: 'doublon', label: 'Doublon' },
  { value: 'contenu_inapproprie', label: 'Contenu inapproprié' },
  { value: 'autre', label: 'Autre' },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
  onDone: () => void;
}

/** Signalement transverse (annonce, profil, message, avis) → file de modération M16. */
export function ReportDialog({ open, onOpenChange, targetType, targetId, onDone }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setReason(null); setDetails(''); setError(null); }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason) return setError('Choisissez un motif.');
    if (reason === 'autre' && !details.trim()) return setError('Décrivez le problème.');
    setSending(true);
    setError(null);
    try {
      await reportService.create({ targetType, targetId, reason, details: details.trim() || undefined });
      onOpenChange(false);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Signaler"
      description="Votre signalement est confidentiel et traité par l'équipe de modération."
      footer={
        <button form="report-form" type="submit" disabled={sending} className="w-full h-11 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
          {sending ? 'Envoi…' : 'Envoyer le signalement'}
        </button>
      }
    >
      <form id="report-form" onSubmit={submit} className="flex flex-col gap-2">
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Motif</legend>
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm cursor-pointer',
                reason === r.value ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-200 text-navy',
              )}
            >
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-red-600" />
              {r.label}
            </label>
          ))}
        </fieldset>
        <label htmlFor="report-details" className="text-xs font-medium text-slate-500 mt-2">Précisions (facultatif)</label>
        <textarea
          id="report-details"
          rows={3}
          maxLength={1000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
        />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
