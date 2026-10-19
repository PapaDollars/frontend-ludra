import type { Metadata } from 'next';
import CandidatePlansPage from '@/views/personnel/CandidatePlansPage';

export const metadata: Metadata = { title: 'Abonnements candidats' };

export default function Page() {
  return <CandidatePlansPage />;
}
