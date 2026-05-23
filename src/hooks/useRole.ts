// hooks/useRole.ts
import { useSafeSession } from '@/hooks/useSafeSession';

export function useRole() {
  const { data: session, status } = useSafeSession();

  return {
    user: session?.user,
    role: session?.user?.role,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isProprietaire: session?.user?.role === 'proprietaire',
    isAdmin: session?.user?.role === 'admin' || session?.user?.role === 'proprietaire',
    isLandlord: session?.user?.role === 'landlord',
    isUser: session?.user?.role === 'user',
    hasRole: (roles: string | string[]) => {
      if (!session?.user?.role) return false;
      if (Array.isArray(roles)) {
        return roles.includes(session.user.role);
      }
      return session.user.role === roles;
    }
  };
}