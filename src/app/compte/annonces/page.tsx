import type { Metadata } from 'next';
import MyItemsPage from '@/views/account/MyItemsPage';

export const metadata: Metadata = { title: 'Mes annonces' };

export default function Page() {
  return <MyItemsPage />;
}
