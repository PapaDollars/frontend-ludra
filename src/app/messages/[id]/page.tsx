import type { Metadata } from 'next';
import { Suspense } from 'react';
import MessagesPage from '@/views/messages/MessagesPage';

export const metadata: Metadata = { title: 'Messages' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense>
      <MessagesPage conversationId={id} />
    </Suspense>
  );
}
