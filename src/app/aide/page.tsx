import type { Metadata } from 'next';
import HelpPage from '@/views/static/HelpPage';

export const metadata: Metadata = { title: 'Aide & contact' };

export default function Page() {
  return <HelpPage />;
}
