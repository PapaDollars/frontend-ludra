import type { Metadata } from 'next';
import AdminUsersPage from '@/views/admin/AdminUsersPage';

export const metadata: Metadata = { title: 'Utilisateurs' };

export default function Page() {
  return <AdminUsersPage />;
}
