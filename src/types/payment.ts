// types/payment.ts — Paiements Mobile Money (M04, puis abonnements M08/M12/M13)
import type { Amount, ISODate } from './common';

export type MobileMoneyOperator = 'mtn_momo' | 'orange_money';

/** `pending` jusqu'au webhook opérateur ; seul `paid` débloque un droit. */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';

export type PaymentPurpose = 'unlock_contact' | 'subscription';

export interface Payment {
  id: string;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  amount: Amount;
  currency: 'XAF';
  operator: MobileMoneyOperator;
  /** Annonce concernée (unlock_contact). */
  listingId?: string;
  /** Plan souscrit (subscription). */
  planCode?: string;
  createdAt: ISODate;
  paidAt?: ISODate;
  /** Message lisible en cas d'échec (solde insuffisant, refus…). */
  failureReason?: string;
}

/** Champs communs à toute demande de paiement Mobile Money. */
export interface MobileMoneyInput {
  operator: MobileMoneyOperator;
  /** Numéro Mobile Money à débiter, format 6XXXXXXXX. */
  payerPhone: string;
  /** Même clé ⇒ même paiement renvoyé (aucun double débit). */
  idempotencyKey: string;
}

export interface SubscribeInput extends MobileMoneyInput {
  planCode: string;
}

export interface UnlockContactInput extends MobileMoneyInput {
  listingId: string;
}
