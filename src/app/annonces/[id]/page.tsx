import type { Metadata } from 'next';
import { Suspense } from 'react';
import ListingPage from '@/views/listing/ListingPage';

export const metadata: Metadata = { title: 'Annonce' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense>
      <ListingPage id={id} />
    </Suspense>
  );
}
