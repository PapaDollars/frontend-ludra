import { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

// Back-office V2.1 (M16) : coque dédiée, hors AppShell public.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
