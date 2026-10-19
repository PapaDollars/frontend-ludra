// mocks/notifications.mock.ts — Centre de notifications (démo, persisté)
import type { AppNotification, NotificationPage } from '@/types';
import { persisted } from './storage';

const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const store = persisted<AppNotification[]>('ludra.mock.notifications', () => [
  { id: 'n-1', kind: 'search_alert', title: '2 nouvelles offres', body: 'Studio Yaoundé ≤ 80 000 F : 2 annonces correspondent à votre recherche.', href: '/recherche?universe=immobilier&city=Yaound%C3%A9&propertyKind=studio&budgetMax=80000', createdAt: ago(1), read: false },
  { id: 'n-2', kind: 'message', title: 'Nadia L. vous a répondu', body: '« Oui, je peux vous proposer samedi à 10h… »', href: '/messages/cv-1', createdAt: ago(3), read: false },
  { id: 'n-3', kind: 'kyc', title: 'Certification à compléter', body: 'Ajoutez vos pièces pour obtenir le badge Vérifié.', href: '/compte/certification', createdAt: ago(30), read: true },
  { id: 'n-4', kind: 'system', title: 'Bienvenue sur LUDRA', body: 'Publiez, recherchez et échangez en toute sécurité. Ne payez jamais avant une visite.', createdAt: ago(200), read: true },
]);

export function mockNotifications(cursor: string | null, limit = 20): NotificationPage {
  const all = store.get();
  const start = cursor ? Number(cursor) : 0;
  const next = start + limit;
  return { items: all.slice(start, next), nextCursor: next < all.length ? String(next) : null, total: all.length, unread: all.filter((n) => !n.read).length };
}

export const mockUnreadNotifications = () => store.get().filter((n) => !n.read).length;

export function mockMarkNotificationRead(id: string) {
  store.set(store.get().map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function mockMarkAllNotificationsRead() {
  store.set(store.get().map((n) => ({ ...n, read: true })));
}
