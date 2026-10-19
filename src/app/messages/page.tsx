import type { Metadata } from 'next';
import { Suspense } from 'react';
import MessagesPage from '@/views/messages/MessagesPage';

export const metadata: Metadata = { title: 'Messages' };

export default function Page() {
  return (
    <Suspense>
      <MessagesPage />
    </Suspense>
  );
}
