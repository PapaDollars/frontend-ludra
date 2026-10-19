import type { Metadata } from 'next';
import SettingsPage from '@/views/account/SettingsPage';

export const metadata: Metadata = { title: 'Paramètres' };

export default function Page() {
  return <SettingsPage />;
}
