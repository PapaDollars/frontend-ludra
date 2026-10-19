import type { Metadata } from 'next';
import ShortlistPage from '@/views/personnel/ShortlistPage';

export const metadata: Metadata = { title: 'Ma shortlist' };

export default function Page() {
  return <ShortlistPage />;
}
