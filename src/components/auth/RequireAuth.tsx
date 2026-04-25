'use client';

import { ReactNode, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: ReactNode;
  roles?: string | string[];
  fallback?: ReactNode;
}

export default function RequireAuth({ children, roles, fallback }: RequireAuthProps) {
  const { user, isAuthenticated, isLoading, hasRole } = useRole();
  const router = useRouter();

  useEffect(() => {
    // Ne rediriger que quand le chargement est terminé
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  // isLoading et isAuthenticated sont des primitives stables — pas de boucle
  }, [isLoading, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return fallback ? <>{fallback}</> : null;
  }

  if (roles && !hasRole(roles)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Accès non autorisé</h2>
          <p>Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
