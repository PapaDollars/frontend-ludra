import { useCallback, useEffect, useState } from 'react';
import { searchService } from '@/services/search.service';
import type { SavedSearch, SavedSearchInput } from '@/types';

/** Recherches sauvegardées de l'utilisateur connecté (vide pour un visiteur). */
export function useSavedSearches(enabled: boolean) {
  const [saved, setSaved] = useState<SavedSearch[]>([]);

  useEffect(() => {
    if (!enabled) { setSaved([]); return; }
    let cancelled = false;
    searchService.listSaved()
      .then((list) => { if (!cancelled) setSaved(list); })
      .catch(() => { /* non bloquant */ });
    return () => { cancelled = true; };
  }, [enabled]);

  const create = useCallback(async (input: SavedSearchInput) => {
    const created = await searchService.createSaved(input);
    setSaved((prev) => [created, ...prev]);
    return created;
  }, []);

  const toggleAlert = useCallback(async (s: SavedSearch) => {
    setSaved((prev) => prev.map((x) => (x.id === s.id ? { ...x, alertEnabled: !s.alertEnabled } : x)));
    try {
      const updated = await searchService.updateSaved(s.id, { alertEnabled: !s.alertEnabled });
      setSaved((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
    } catch {
      setSaved((prev) => prev.map((x) => (x.id === s.id ? s : x)));
      throw new Error("Impossible de modifier l'alerte");
    }
  }, []);

  const remove = useCallback(async (s: SavedSearch) => {
    setSaved((prev) => prev.filter((x) => x.id !== s.id));
    try {
      await searchService.deleteSaved(s.id);
    } catch {
      setSaved((prev) => [s, ...prev]);
      throw new Error('Impossible de supprimer la recherche');
    }
  }, []);

  return { saved, create, toggleAlert, remove };
}
