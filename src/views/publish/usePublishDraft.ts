import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';
import { publishService } from '@/services/publish.service';
import type { PublishDraft, PublishDraftPatch, Universe } from '@/types';

const AUTOSAVE_MS = 1200;

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const localDraft = (): PublishDraft => ({
  id: '', type: null, step: 0, listing: {}, candidate: {}, service: {}, media: [], updatedAt: new Date().toISOString(),
});

const toPatch = (d: PublishDraft): PublishDraftPatch => ({
  type: d.type, step: d.step, listing: d.listing, candidate: d.candidate, service: d.service, media: d.media,
});

/**
 * Brouillon de publication : chargé depuis ?draft=, créé au choix du type,
 * sauvegardé automatiquement (anti-rebond) à chaque modification.
 */
export function usePublishDraft(draftId: string | null, enabled: boolean) {
  const [draft, setDraft] = useState<PublishDraft>(localDraft);
  const [loading, setLoading] = useState(!!draftId);
  const [notFound, setNotFound] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!draftId) { setDraft(localDraft()); setLoading(false); return; }
    if (draftRef.current.id === draftId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    publishService.getDraft(draftId)
      .then((d) => { if (!cancelled) { setDraft(d); setSavedAt(d.updatedAt); setSaveState('saved'); } })
      .catch((e) => { if (!cancelled && e instanceof ApiError && e.status === 404) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [draftId, enabled]);

  const save = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (inFlight.current) await inFlight.current;
    const d = draftRef.current;
    if (!d.id || !dirty.current) return;
    dirty.current = false;
    setSaveState('saving');
    const p = publishService.updateDraft(d.id, toPatch(d))
      .then((saved) => { setSavedAt(saved.updatedAt); setSaveState(dirty.current ? 'saving' : 'saved'); })
      .catch(() => { dirty.current = true; setSaveState('error'); });
    inFlight.current = p;
    await p;
    inFlight.current = null;
  }, []);

  const schedule = useCallback(() => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, AUTOSAVE_MS);
  }, [save]);

  // Sauvegarde avant de quitter la page
  useEffect(() => () => { if (dirty.current) save(); }, [save]);

  const update = useCallback((patch: PublishDraftPatch) => {
    setDraft((d) => ({ ...d, ...patch }));
    draftRef.current = { ...draftRef.current, ...patch };
    schedule();
  }, [schedule]);

  /** Fusionne dans les données de l'univers courant (listing / candidate / service). */
  const updateData = useCallback((patch: Record<string, unknown>) => {
    const d = draftRef.current;
    const key = d.type === 'immobilier' ? 'listing' : d.type === 'personnel' ? 'candidate' : 'service';
    update({ [key]: { ...d[key], ...patch } });
  }, [update]);

  /** Crée le brouillon serveur au choix du type (évite les brouillons vides). */
  const create = useCallback(async (type: Universe, onBehalfOf?: PublishDraft['onBehalfOf']) => {
    const created = await publishService.createDraft({ ...toPatch(draftRef.current), type, step: 1, ...(onBehalfOf ? { onBehalfOf } : {}) });
    setDraft(created);
    draftRef.current = created;
    setSavedAt(created.updatedAt);
    setSaveState('saved');
    return created;
  }, []);

  return { draft, loading, notFound, saveState, savedAt, update, updateData, create, flush: save };
}
