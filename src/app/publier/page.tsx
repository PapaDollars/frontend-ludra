import type { Metadata } from 'next';
import { Suspense } from 'react';
import PublishPage from '@/views/publish/PublishPage';

export const metadata: Metadata = { title: 'Publier une offre' };

export default function Page() {
  return (
    <Suspense>
      <PublishPage />
    </Suspense>
  );
}
