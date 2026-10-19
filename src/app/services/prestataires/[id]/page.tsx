import type { Metadata } from 'next';
import ServiceProviderPage from '@/views/services/ServiceProviderPage';

export const metadata: Metadata = { title: 'Prestataire' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ServiceProviderPage id={id} />;
}
