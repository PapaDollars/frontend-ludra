import type { Metadata } from 'next';
import PaymentsPage from '@/views/account/PaymentsPage';

export const metadata: Metadata = { title: 'Paiements' };

export default function Page() {
  return <PaymentsPage />;
}
