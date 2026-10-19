import type { Metadata } from 'next';
import AdminReportsPage from '@/views/admin/AdminReportsPage';

export const metadata: Metadata = { title: 'Avis & signalements' };

export default function Page() {
  return <AdminReportsPage />;
}
