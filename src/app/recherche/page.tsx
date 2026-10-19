import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchPage from '@/views/search/SearchPage';

export const metadata: Metadata = { title: 'Recherche' };

// useSearchParams impose une frontière Suspense en App Router.
export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
