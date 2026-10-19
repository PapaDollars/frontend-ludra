import type { Metadata } from 'next';
import SubjectReviewsPage from '@/views/reviews/SubjectReviewsPage';

export const metadata: Metadata = { title: 'Avis & réputation' };

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { userId } = await params;
  return <SubjectReviewsPage userId={userId} />;
}
