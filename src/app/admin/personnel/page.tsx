import type { Metadata } from 'next';
import AdminProofsPage from '@/views/admin/AdminProofsPage';

export const metadata: Metadata = { title: 'Preuves' };

export default function Page() {
  return <AdminProofsPage />;
}
