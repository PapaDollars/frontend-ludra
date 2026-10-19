import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { meService } from '@/services/me.service';
import type { MeCounters } from '@/types';

const EMPTY: MeCounters = { unreadMessages: 0, unreadNotifications: 0 };
const POLL_MS = 30_000;

/**
 * Badges non lus du header : interrogés toutes les 30 s, à chaque changement de page,
 * et à la demande (`refresh`, ex. après lecture d'une notification).
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
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  useEffect(() => { refresh(); }, [refresh, pathname]);

  return { ...counters, refresh };
}
