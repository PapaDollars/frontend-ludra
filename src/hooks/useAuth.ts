import { useSession } from 'next-auth/react';

export function useAuth() {
  const sessionState = useSession();
  const session = sessionState?.data;
  const status = sessionState?.status;

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    user: session?.user ?? null,
  };
}
