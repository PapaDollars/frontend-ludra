import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { meService } from '@/services/me.service';
import type { MeCounters } from '@/types';

const EMPTY: MeCounters = { unreadMessages: 0, unreadNotifications: 0 };
const POLL_MS = 30_000;

/**
 * Badges non lus du header : interrogés toutes les 30 s tant que l'onglet est visible,
 * au retour sur l'onglet, à chaque changement de page et à la demande (`refresh`).
 * Pas d'appel quand l'onglet est en arrière-plan (chaque appel coûte des lectures Firestore).
 */
export function useCounters(enabled: boolean) {
  const [counters, setCounters] = useState<MeCounters>(EMPTY);
  const pathname = usePathname();

  const refresh = useCallback(() => {
    if (!enabled) return;
    meService.getCounters().then(setCounters).catch(() => { /* silencieux : les badges ne sont pas critiques */ });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) { setCounters(EMPTY); return; }
    const id = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [enabled, refresh]);

  useEffect(() => { refresh(); }, [refresh, pathname]);

  return { ...counters, refresh };
}
