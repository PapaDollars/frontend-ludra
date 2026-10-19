import type { Metadata } from 'next';
import RecruiterPlansPage from '@/views/personnel/RecruiterPlansPage';

export const metadata: Metadata = { title: 'Forfaits recruteurs' };

export default function Page() {
  return <RecruiterPlansPage />;
}
