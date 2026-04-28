import PropertyDetailPage from '@/views/public/properties/detail/page';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailRoute({ params }: PageProps) {
  // Obligatoire en Next.js 15 même si on n'utilise pas l'id ici
  await params;
  return <PropertyDetailPage />;
}