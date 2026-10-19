import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';
import { messagingService } from '@/services/messaging.service';
import type { Conversation, Message } from '@/types';

const POLL_MS = 4000;
const PAGE = 30;

/** Message affiché localement avant confirmation serveur. */
export type UiMessage = Message & { local?: 'sending' | 'failed'; file?: File };

const isLocal = (m: UiMessage) => m.id.startsWith('local-');

/**
 * Conversation ouverte : historique paginé, nouveaux messages (polling),
 * envoi optimiste avec relance, lecture et blocage.
 */
export function useConversation(id: string, onActivity: (c: Partial<Conversation>) => void) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<UiMessage[]>([]);
  messagesRef.current = messages;
  const onActivityRef = useRef(onActivity);
  onActivityRef.current = onActivity;

  const markRead = useCallback(() => {
    messagingService.markRead(id).catch(() => { /* non bloquant */ });
    onActivityRef.current({ unreadCount: 0 });
  }, [id]);

  // Chargement initial
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(null);
    setMessages([]);
    Promise.all([messagingService.get(id), messagingService.messages(id, { limit: PAGE })])
      .then(([conv, page]) => {
        if (cancelled) return;
        setConversation(conv);
        setMessages(page.items);
        setOlderCursor(page.nextCursor);
        if (conv.unreadCount > 0) markRead();
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 404 || e.status === 403)) setNotFound(true);
        else setError(e instanceof Error ? e.message : 'Impossible de charger la conversation.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, markRead]);

  // Nouveaux messages + état de la conversation (blocage, en ligne)
  useEffect(() => {
    if (loading || notFound) return;
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      const confirmed = messagesRef.current.filter((m) => !isLocal(m));
      const lastId = confirmed[confirmed.length - 1]?.id;
      try {
        const [page, conv] = await Promise.all([
          messagingService.messages(id, lastId ? { after: lastId } : { limit: PAGE }),
          messagingService.get(id),
        ]);
        setConversation(conv);
        if (page.items.length) {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            const fresh = page.items.filter((m) => !known.has(m.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
          if (page.items.some((m) => !m.fromMe)) markRead();
        }
      } catch { /* réessai au tick suivant */ }
    };
    const t = setInterval(tick, POLL_MS);
    return () => clearInterval(t);
  }, [id, loading, notFound, markRead]);

  const loadOlder = useCallback(async () => {
    if (!olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await messagingService.messages(id, { before: olderCursor, limit: PAGE });
      setMessages((prev) => [...page.items, ...prev]);
      setOlderCursor(page.nextCursor);
    } finally {
      setLoadingOlder(false);
    }
  }, [id, olderCursor, loadingOlder]);

  const deliver = useCallback(async (localId: string, text: string, file?: File) => {
    try {
      const sent = await messagingService.send(id, text, file);
      setMessages((prev) => prev.map((m) => (m.id === localId ? sent : m)));
      onActivityRef.current({
        updatedAt: sent.createdAt,
        lastMessage: { text: sent.text ?? 'Photo', fromMe: true, createdAt: sent.createdAt },
      });
      return null;
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, local: 'failed' } : m)));
      if (e instanceof ApiError && e.status === 429) return 'Vous envoyez trop de messages. Patientez un instant.';
      return e instanceof Error ? e.message : "Message non envoyé.";
    }
  }, [id]);

  /** Envoi optimiste. Renvoie un message d'erreur lisible, ou null. */
  const send = useCallback((text: string, file?: File) => {
    const localId = `local-${Date.now()}`;
    const optimistic: UiMessage = {
      id: localId, conversationId: id, kind: file ? 'image' : 'text', fromMe: true,
      text: text || undefined, createdAt: new Date().toISOString(), local: 'sending', file,
      ...(file ? { image: { url: globalThis.URL.createObjectURL(file) } } : {}),
    };
    setMessages((prev) => [...prev, optimistic]);
    return deliver(localId, text, file);
  }, [id, deliver]);

  const retry = useCallback((m: UiMessage) => {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, local: 'sending' } : x)));
    return deliver(m.id, m.text ?? '', m.file);
  }, [deliver]);

  const setBlocked = useCallback(async (blocked: boolean) => {
    const conv = await messagingService.setBlocked(id, blocked);
    setConversation(conv);
    onActivityRef.current({ blockedByMe: conv.blockedByMe });
  }, [id]);

  return { conversation, messages, loading, notFound, error, hasOlder: !!olderCursor, loadingOlder, loadOlder, send, retry, setBlocked };
}
