import type { Metadata } from 'next';
import MyReviewsPage from '@/views/reviews/MyReviewsPage';

export const metadata: Metadata = { title: 'Mes avis' };

export default function Page() {
  return <MyReviewsPage />;
}
