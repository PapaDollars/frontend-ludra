'use client';

import { useEffect } from 'react';
import { setTokens } from '@/lib/api';
import { useSafeSession } from '@/hooks/useSafeSession';

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

  return <>{children}</>;
}
