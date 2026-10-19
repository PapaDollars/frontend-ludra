import type { Metadata } from 'next';
import CandidatePage from '@/views/personnel/CandidatePage';

export const metadata: Metadata = { title: 'Profil candidat' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CandidatePage id={id} />;
}
