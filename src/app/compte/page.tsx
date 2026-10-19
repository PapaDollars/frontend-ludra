import type { Metadata } from 'next';
import AccountPage from '@/views/account/AccountPage';

export const metadata: Metadata = { title: 'Mon compte' };

export default function Page() {
  return <AccountPage />;
}
