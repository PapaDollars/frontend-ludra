import type { Metadata } from 'next';
import ServicesCatalogPage from '@/views/services/ServicesCatalogPage';

export const metadata: Metadata = { title: 'Autres services' };

export default function Page() {
  return <ServicesCatalogPage />;
}
