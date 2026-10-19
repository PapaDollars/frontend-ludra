import type { Metadata } from 'next';
import FavoritesPage from '@/views/account/FavoritesPage';

export const metadata: Metadata = { title: 'Favoris' };

export default function Page() {
  return <FavoritesPage />;
}
