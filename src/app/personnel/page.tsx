import type { Metadata } from 'next';
import { Suspense } from 'react';
import PersonnelPage from '@/views/personnel/PersonnelPage';

export const metadata: Metadata = { title: 'Placement du personnel' };

export default function Page() {
  return (
    <Suspense>
      <PersonnelPage />
    </Suspense>
  );
}
