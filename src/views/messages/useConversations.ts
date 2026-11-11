import { useCallback, useEffect, useRef, useState } from 'react';
import { messagingService } from '@/services/messaging.service';
import type { Conversation } from '@/types';

const POLL_MS = 15_000;

/** Liste de mes conversations, rafraîchie périodiquement (nouveaux messages, non lus). */
export function useConversations(enabled: boolean, query: string) {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  const refresh = useCallback(async () => {
    try {
      const page = await messagingService.list(queryRef.current.trim() || undefined);
      setConversations(page.items);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les conversations.');
    }
  }, []);

  // Recherche avec anti-rebond
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(refresh, query ? 250 : 0);
    return () => clearTimeout(t);
  }, [enabled, query, refresh]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  /** Mise à jour locale immédiate (lu, dernier message envoyé, blocage…). */
  const listRef = useRef<Conversation[] | null>(null);
  listRef.current = conversations;

  const patch = useCallback((id: string, p: Partial<Conversation>) => {
    // Conversation absente de la liste (ex. premier message : le serveur ne liste que les conversations non vides)
    if (p.lastMessage && listRef.current && !listRef.current.some((c) => c.id === id)) {
      refresh();
      return;
    }
    setConversations((prev) => {
      if (!prev) return prev;
      const next = prev.map((c) => (c.id === id ? { ...c, ...p } : c));
      return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
  }, [refresh]);

  return { conversations, error, refresh, patch };
}
