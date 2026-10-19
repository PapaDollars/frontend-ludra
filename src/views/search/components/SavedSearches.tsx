'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

import type { SavedSearch } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Field, TextInput } from '@/components/ui/Form';

interface SavedSearchesBarProps {
  saved: SavedSearch[];
  onApply: (s: SavedSearch) => void;
  onToggleAlert: (s: SavedSearch) => void;
  onRemove: (s: SavedSearch) => void;
}

/** "Mes recherches" : puces défilables (appliquer, alerte on/off, supprimer). */
export function SavedSearchesBar({ saved, onApply, onToggleAlert, onRemove }: SavedSearchesBarProps) {
  if (saved.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="px-4 md:px-0 text-xs font-medium text-slate-500">Mes recherches</span>
      <ul className="flex gap-2 overflow-x-auto px-4 md:px-0 no-scrollbar">
        {saved.map((s) => (
          <li key={s.id} className="shrink-0 flex items-center h-9 rounded-full bg-white border border-slate-200 pl-3 pr-1 text-sm">
            <button type="button" onClick={() => onApply(s)} className="flex items-center gap-1.5 text-navy font-medium hover:text-brand max-w-[220px]">
              <span className="truncate">{s.name}</span>
              {s.newResults > 0 && (
                <span className="rounded-full bg-brand text-white text-[10px] font-bold px-1.5" aria-label={`${s.newResults} nouvelles offres`}>
                  +{s.newResults}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onToggleAlert(s)}
              aria-pressed={s.alertEnabled}
              aria-label={s.alertEnabled ? `Désactiver l'alerte « ${s.name} »` : `Activer l'alerte « ${s.name} »`}
              className="ml-1 w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface"
            >
              {s.alertEnabled ? <Bell className="w-3.5 h-3.5 text-brand fill-current" /> : <BellOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <button
              type="button"
              onClick={() => onRemove(s)}
              aria-label={`Supprimer « ${s.name} »`}
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-surface hover:text-red-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SaveSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  onSave: (name: string, alertEnabled: boolean) => Promise<void>;
}

export function SaveSearchDialog({ open, onOpenChange, defaultName, onSave }: SaveSearchDialogProps) {
  const [name, setName] = useState(defaultName);
  const [alert, setAlert] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setName(defaultName); setAlert(true); setError(null); }
  }, [open, defaultName]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Donnez un nom à cette recherche.');
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), alert);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Enregistrer la recherche"
      description="Retrouvez-la dans « Mes recherches » et soyez alerté des nouvelles offres."
      footer={
        <button form="save-search-form" type="submit" disabled={saving} className="w-full h-11 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      }
    >
      <form id="save-search-form" onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nom" htmlFor="saved-search-name">
          <TextInput id="saved-search-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </Field>
        <label className="flex items-center gap-3 text-sm text-navy cursor-pointer">
          <input type="checkbox" checked={alert} onChange={(e) => setAlert(e.target.checked)} className="w-4 h-4 accent-brand" />
          M&apos;alerter des nouvelles offres correspondantes
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
