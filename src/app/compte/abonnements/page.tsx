import type { Metadata } from 'next';
import OwnerPlansPage from '@/views/subscriptions/OwnerPlansPage';

export const metadata: Metadata = { title: 'Abonnements' };

// Abonnements Propriétaire / Agent (M08). Candidats (M12) : /personnel/abonnements · Recruteurs (M13) : /personnel/forfaits.
export default function Page() {
  return <OwnerPlansPage />;
}
