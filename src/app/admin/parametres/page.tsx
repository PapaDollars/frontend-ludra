import type { Metadata } from 'next';
import AdminSettingsPage from '@/views/admin/AdminSettingsPage';

export const metadata: Metadata = { title: 'Paramètres produit' };

export default function Page() {
  return <AdminSettingsPage />;
}
