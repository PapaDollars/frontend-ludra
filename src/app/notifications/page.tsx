import type { Metadata } from 'next';
import NotificationsPage from '@/views/notifications/NotificationsPage';

export const metadata: Metadata = { title: 'Notifications' };

export default function Page() {
  return <NotificationsPage />;
}
