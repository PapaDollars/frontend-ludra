// mocks/payment.mock.ts — Paiements Mobile Money simulés (déblocage contact, abonnements…)
//
//  - le paiement passe "paid" ~6 s après sa création (comme un webhook opérateur) ;
//  - un numéro payeur finissant par 0000 simule un échec (ex. 690000000) ;
//  - même clé d'idempotence ⇒ même paiement (aucun double débit).
import { ApiError } from '@/lib/api';
import type { MobileMoneyInput, Payment, PaymentPurpose, PaymentRecord } from '@/types';
import { persisted } from './storage';

const PAYMENT_DELAY_MS = 6000;

type Stored = Payment & { resolveAt: number; willFail: boolean; onPaid: () => void };

const payments = new Map<string, Stored>();
const byKey = new Map<string, string>();
let seq = 0;

/** Historique (Mon compte › Paiements), persistant en démo. */
const history = persisted<PaymentRecord[]>('ludra.mock.payments', () => []);
const meta = new Map<string, Pick<PaymentRecord, 'label' | 'listing' | 'plan'>>();

function record(p: Payment) {
  const m = meta.get(p.id);
  if (!m) return;
  const rec: PaymentRecord = { ...p, ...m, ...(p.status === 'paid' ? { receiptNumber: `LUD-${p.id.slice(-8).toUpperCase()}` } : {}) };
  history.set([rec, ...history.get().filter((r) => r.id !== p.id)]);
}

export const mockPaymentHistory = () => history.get();

function settle(p: Stored): Payment {
  if (p.status === 'pending' && Date.now() >= p.resolveAt) {
    if (p.willFail) {
      p.status = 'failed';
      p.failureReason = 'Paiement refusé par l’opérateur (solde insuffisant ou délai dépassé).';
    } else {
      p.status = 'paid';
      p.paidAt = new Date().toISOString();
      p.onPaid();
    }
  }
  const { resolveAt: _r, willFail: _w, onPaid: _o, ...pub } = p;
  record(pub);
  return pub;
}

interface CreateInput extends MobileMoneyInput {
  purpose: PaymentPurpose;
  amount: number;
  listingId?: string;
  planCode?: string;
  /** Droit déjà acquis : paiement "paid" sans débit. */
  alreadyPaid?: boolean;
  /** Effet du webhook "paid" (débloquer, activer l'abonnement…). */
  onPaid: () => void;
  /** Libellé d'historique, ex. "Déblocage contact — Studio Omnisport". */
  label: string;
  listing?: PaymentRecord['listing'];
  plan?: PaymentRecord['plan'];
}

export function mockCreatePayment({ onPaid, alreadyPaid, idempotencyKey, payerPhone, label, listing, plan, ...input }: CreateInput): Payment {
  const existing = byKey.get(idempotencyKey);
  if (existing) return settle(payments.get(existing)!);

  const p: Stored = {
    id: `pay-${Date.now()}-${++seq}`,
    purpose: input.purpose,
    status: alreadyPaid ? 'paid' : 'pending',
    amount: input.amount,
    currency: 'XAF',
    operator: input.operator,
    ...(input.listingId ? { listingId: input.listingId } : {}),
    ...(input.planCode ? { planCode: input.planCode } : {}),
    createdAt: new Date().toISOString(),
    resolveAt: Date.now() + PAYMENT_DELAY_MS,
    willFail: payerPhone.endsWith('0000'),
    onPaid,
  };
  payments.set(p.id, p);
  byKey.set(idempotencyKey, p.id);
  // Déjà acquis : pas de nouvelle ligne d'historique (aucun débit).
  if (!alreadyPaid) meta.set(p.id, { label, ...(listing ? { listing } : {}), ...(plan ? { plan } : {}) });
  return settle(p);
}

export function mockGetPayment(id: string): Payment {
  const p = payments.get(id);
  if (!p) throw new ApiError('Paiement introuvable', 404, 'NOT_FOUND');
  return settle(p);
}
