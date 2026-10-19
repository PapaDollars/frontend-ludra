import type { Metadata } from 'next';
import AdminListingsPage from '@/views/admin/AdminListingsPage';

export const metadata: Metadata = { title: 'Modération des annonces' };

export default function Page() {
  return <AdminListingsPage />;
}
