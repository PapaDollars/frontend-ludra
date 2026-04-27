import { useSession } from 'next-auth/react';

type SafeSessionState = {
  data: ReturnType<typeof useSession>['data'];
  status: ReturnType<typeof useSession>['status'];
};

export function useSafeSession(): SafeSessionState {
  const sessionState = useSession();

  if (!sessionState) {
    return { data: null, status: 'unauthenticated' };
  }

  return {
    data: sessionState.data,
    status: sessionState.status,
  };
}
