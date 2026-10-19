import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import URL from '@/utilis/url/url_front';
import { useRole } from '@/hooks/useRole';

/** Redirige vers la connexion (avec retour sur la page courante) si l'utilisateur n'est pas connecté. */
export function useRequireAuth() {
  const router = useRouter();
  const role = useRole();

  useEffect(() => {
    if (role.isLoading || role.isAuthenticated) return;
    router.replace(URL.auth.loginThen(window.location.pathname + window.location.search));
  }, [role.isLoading, role.isAuthenticated, router]);

  return { ...role, ready: role.isAuthenticated };
}
