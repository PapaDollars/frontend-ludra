import type { Metadata } from 'next';
import ReceiptPage from '@/views/account/ReceiptPage';

export const metadata: Metadata = { title: 'Reçu de paiement' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ReceiptPage id={id} />;
}
