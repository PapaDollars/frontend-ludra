'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AuthLayout from './AuthLayout';
import { AppShell } from '@/components/shell/AppShell';

interface RootLayoutProps {
  children: ReactNode;
}

/** Coque selon la zone : authentification, back-office (layout dédié), ou site V2.1. */
export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname() ?? '';

  if (pathname.startsWith('/auth')) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  // Back-office : sa coque est posée par src/app/admin/layout.tsx
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
