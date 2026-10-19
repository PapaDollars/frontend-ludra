import type { Metadata } from 'next';
import AboutPage from '@/views/static/AboutPage';

export const metadata: Metadata = { title: 'À propos' };

export default function Page() {
  return <AboutPage />;
}
