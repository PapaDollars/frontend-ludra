'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { FileCheck2, Loader2, Trash2, Upload, XCircle } from 'lucide-react';

import { cn } from '@/utilis/utils';
import { KYC_FILE_TYPES, KYC_MAX_BYTES } from '@/lib/kycRequirements';
import type { KycDocument } from '@/types';

interface DocumentSlotProps {
  label: string;
  doc?: KycDocument;
  editable: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: (doc: KycDocument) => Promise<void>;
}

/** Emplacement d'une pièce : nom du fichier seulement (aucun aperçu public). */
export function DocumentSlot({ label, doc, editable, onUpload, onRemove }: DocumentSlotProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!KYC_FILE_TYPES.includes(file.type)) return setError('Formats acceptés : JPG, PNG, WebP ou PDF.');
    if (file.size > KYC_MAX_BYTES) return setError('Fichier trop lourd (10 Mo maximum).');
    setError(null);
    setBusy(true);
    try { await onUpload(file); } catch (err) { setError(err instanceof Error ? err.message : 'Échec du dépôt.'); } finally { setBusy(false); }
  };

  const rejected = doc?.status === 'rejected';

  return (
    <div className={cn('flex flex-col gap-1 rounded-lg border px-3 py-2', rejected ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white')}>
      <div className="flex items-center gap-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin text-brand" />
          : rejected ? <XCircle className="w-4 h-4 text-red-500" />
            : doc ? <FileCheck2 className="w-4 h-4 text-trust" />
              : <Upload className="w-4 h-4 text-slate-300" />}
        <span className="text-xs font-medium text-slate-500 w-14 shrink-0">{label}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-navy">{doc ? doc.fileName : 'Aucun fichier'}</span>
        {editable && (
          <>
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className="text-xs font-semibold text-brand hover:underline disabled:opacity-50">
              {doc ? 'Remplacer' : 'Ajouter'}
            </button>
            {doc && (
              <button type="button" disabled={busy} onClick={() => onRemove(doc)} aria-label={`Supprimer ${label}`} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
      </div>
      {rejected && doc?.rejectionReason && <p className="text-[11px] text-red-600">{doc.rejectionReason}</p>}
      {error && <p role="alert" className="text-[11px] text-red-600">{error}</p>}
      {editable && <input ref={input} type="file" accept={KYC_FILE_TYPES.join(',')} onChange={onPick} className="hidden" />}
    </div>
  );
}
