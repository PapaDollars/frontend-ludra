import type { Metadata } from 'next';
import AdminAuditPage from '@/views/admin/AdminAuditPage';

export const metadata: Metadata = { title: "Journal d'audit" };

export default function Page() {
  return <AdminAuditPage />;
}
