import { useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { clearTokens } from '@/lib/api';
import URL from '@/utilis/url/url_front';

/** Déconnexion complète : tokens API + session NextAuth, retour au feed. */
export function useLogout() {
  return useCallback(async () => {
    clearTokens();
    await signOut({ callbackUrl: URL.v2.feed });
  }, []);
}
