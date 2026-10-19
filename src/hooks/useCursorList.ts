import { useCallback, useEffect, useRef, useState } from 'react';
import type { CursorPage } from '@/types';

/**
 * Liste paginée par curseur (scroll infini).
 * La liste repart de zéro à chaque changement de `key` (onglet, filtres…).
 */
export function useCursorList<T extends { id: string }>(
  fetchPage: (cursor: string | null) => Promise<CursorPage<T>>,
  key: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const cursorRef = useRef<string | null>(null);
  // Ignore les réponses d'une requête périmée (changement de key pendant le chargement).
  const requestId = useRef(0);
  const inFlight = useRef(false);

  const load = useCallback(async (reset: boolean) => {
    // Une page à la fois ; un reset passe toujours.
    if (!reset && inFlight.current) return;
    inFlight.current = true;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchRef.current(reset ? null : cursorRef.current);
      if (id !== requestId.current) return;
      setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
      cursorRef.current = page.nextCursor;
      setHasMore(page.nextCursor !== null);
      if (page.total !== undefined) setTotal(page.total);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : 'Impossible de charger les offres.');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        inFlight.current = false;
      }
    }
  }, []);

  useEffect(() => {
    setItems([]);
    setTotal(null);
    setHasMore(true);
    cursorRef.current = null;
    load(true);
  }, [key, load]);

  const loadMore = useCallback(() => {
    // Après une erreur, on attend un "Réessayer" explicite (pas de boucle via le scroll).
    if (!loading && hasMore && !error) load(false);
  }, [loading, hasMore, error, load]);

  const retry = useCallback(() => load(items.length === 0), [load, items.length]);

  const updateItem = useCallback((id: string, patch: Partial<T>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  return { items, total, loading, error, hasMore, loadMore, retry, updateItem };
}

/** Déclenche `onVisible` quand l'élément sentinelle approche du viewport. */
export function useInfiniteSentinel(onVisible: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) onVisible();
    }, { rootMargin: '400px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible]);
  return ref;
}
