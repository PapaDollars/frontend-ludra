import type { Metadata } from 'next';
import AdminDashboardPage from '@/views/admin/AdminDashboardPage';

export const metadata: Metadata = { title: 'Back-office' };

export default function Page() {
  return <AdminDashboardPage />;
}
