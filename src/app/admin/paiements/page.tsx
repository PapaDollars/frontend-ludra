import type { Metadata } from 'next';
import AdminPaymentsPage from '@/views/admin/AdminPaymentsPage';

export const metadata: Metadata = { title: 'Paiements (admin)' };

export default function Page() {
  return <AdminPaymentsPage />;
}
