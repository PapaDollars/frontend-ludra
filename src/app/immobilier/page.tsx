import type { Metadata } from 'next';
import FeedPage from '@/views/feed/FeedPage';

export const metadata: Metadata = { title: 'Immobilier' };

export default function Page() {
  return <FeedPage filter="immobilier" />;
}
