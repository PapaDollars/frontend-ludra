import type { Metadata } from 'next';
import ServiceCategoryPage from '@/views/services/ServiceCategoryPage';

export const metadata: Metadata = { title: 'Prestataires' };

interface PageProps {
  params: Promise<{ categorie: string }>;
}

export default async function Page({ params }: PageProps) {
  const { categorie } = await params;
  return <ServiceCategoryPage code={categorie} />;
}
