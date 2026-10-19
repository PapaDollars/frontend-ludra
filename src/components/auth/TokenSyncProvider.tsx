'use client';

import { useEffect } from 'react';
import { setTokens, api } from '@/lib/api';
import { useSafeSession } from '@/hooks/useSafeSession';

const POLL_INTERVAL_MS = 1_800_000; // vérifier toutes les 30 minutes

export default function TokenSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSafeSession();
  const accessToken = (session as any)?.accessToken as string | undefined;
  const refreshToken = (session as any)?.refreshToken as string | undefined;

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) return;

    // Restaure uniquement si localStorage est vide (ne pas écraser un token rafraîchi)
    if (!localStorage.getItem('accessToken')) {
      setTokens(accessToken, refreshToken || '');
    }
  }, [status, accessToken, refreshToken]);

  // Polling : vérifie que le compte existe toujours côté backend.
  // Si le compte a été supprimé par un admin, l'API renvoie 401 et
  // le client api.ts appelle forceSignOut() automatiquement.
  useEffect(() => {
    if (status !== 'authenticated') return;

    const check = () => {
      api.get('/auth/me').catch(() => {
        // forceSignOut() est déjà appelé dans api.ts sur 401
      });
    };

    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status]);

  return <>{children}</>;
}
