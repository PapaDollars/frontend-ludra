import type { Metadata } from 'next';
import CertificationPage from '@/views/certification/CertificationPage';

export const metadata: Metadata = { title: 'Certification' };

export default function Page() {
  return <CertificationPage />;
}
