'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import TokenSyncProvider from '@/components/auth/TokenSyncProvider';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <TokenSyncProvider>{children}</TokenSyncProvider>
    </SessionProvider>
  );
}