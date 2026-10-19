// types/notification.ts — Centre de notifications (messages, alertes, avis, KYC, paiements…)
import type { CursorPage, ISODate } from './common';

export type NotificationKind =
  | 'message'       // nouveau message (M05)
  | 'search_alert'  // nouvelles offres d'une recherche sauvegardée (M02)
  | 'review'        // avis reçu / réponse (M09)
  | 'kyc'           // décision de certification (M07)
  | 'payment'       // paiement confirmé / échoué (M04, M08…)
  | 'listing'       // décision de modération sur une publication (M16)
  | 'subscription'  // expiration proche d'un plan
  | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Lien interne vers l'objet concerné. */
  href?: string;
  createdAt: ISODate;
  read: boolean;
}

export interface NotificationPage extends CursorPage<AppNotification> {
  unread: number;
}
