import type { Metadata } from 'next';
import AdminKycPage from '@/views/admin/AdminKycPage';

export const metadata: Metadata = { title: 'Vérifications' };

export default function Page() {
  return <AdminKycPage />;
}
