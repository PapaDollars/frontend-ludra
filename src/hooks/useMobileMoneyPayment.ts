import { useCallback, useEffect, useRef, useState } from 'react';
import { paymentService } from '@/services/payment.service';
import type { MobileMoneyInput, MobileMoneyOperator, Payment } from '@/types';

const POLL_MS = 3000;
const TIMEOUT_MS = 120_000;

/**
 * form → submitting → pending → paid
 *                            ↘ failed   (nouvelle tentative = nouvelle clé d'idempotence)
 *                            ↘ timeout  (même clé conservée : aucun double débit)
 */
export type PaymentPhase = 'form' | 'submitting' | 'pending' | 'timeout' | 'failed' | 'paid';

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Paiement Mobile Money générique (déblocage contact, abonnements…).
 * Le droit n'est accordé qu'après un statut `paid` confirmé par le serveur (webhook opérateur).
 *
 * @param create  lance la demande (POST /payments/…)
 * @param onPaid  effet après confirmation (récupérer le contact, rafraîchir l'abonnement…) ; une erreur reste affichée en phase `paid`
 */
export function useMobileMoneyPayment(
  create: (input: MobileMoneyInput) => Promise<Payment>,
  onPaid: (p: Payment) => Promise<void> | void,
) {
  const [phase, setPhase] = useState<PaymentPhase>('form');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef(newKey());
  const createRef = useRef(create);
  createRef.current = create;
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  const runOnPaid = useCallback(async (p: Payment) => {
    setPhase('paid');
    try {
      await onPaidRef.current(p);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action momentanément indisponible.');
    }
  }, []);

  const handle = useCallback((p: Payment) => {
    setPayment(p);
    if (p.status === 'paid') runOnPaid(p);
    else if (p.status === 'pending') setPhase('pending');
    else {
      setError(p.failureReason ?? 'Le paiement n’a pas abouti. Aucun montant n’a été débité.');
      setPhase('failed');
      keyRef.current = newKey();
    }
  }, [runOnPaid]);

  const start = useCallback(async (operator: MobileMoneyOperator, payerPhone: string) => {
    setPhase('submitting');
    setError(null);
    try {
      handle(await createRef.current({ operator, payerPhone, idempotencyKey: keyRef.current }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de lancer le paiement.');
      setPhase('form');
    }
  }, [handle]);

  // Suivi du paiement en attente
  const paymentId = payment?.id;
  useEffect(() => {
    if (phase !== 'pending' || !paymentId) return;
    const startedAt = Date.now();
    let cancelled = false;
    const id = setInterval(async () => {
      if (Date.now() - startedAt > TIMEOUT_MS) {
        clearInterval(id);
        if (!cancelled) setPhase('timeout');
        return;
      }
      try {
        const p = await paymentService.getById(paymentId);
        if (!cancelled && p.status !== 'pending') { clearInterval(id); handle(p); }
      } catch { /* réessai au tick suivant */ }
    }, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [phase, paymentId, handle]);

  /** Après un délai dépassé : reprendre le suivi du même paiement. */
  const resume = useCallback(() => setPhase('pending'), []);
  /** Après un échec : revenir au formulaire (nouvelle clé déjà générée). */
  const retry = useCallback(() => { setError(null); setPhase('form'); }, []);
  /** Rejouer l'effet post-paiement (ex. récupération du contact en échec). */
  const retryOnPaid = useCallback(() => { if (payment) runOnPaid(payment); }, [payment, runOnPaid]);
  /** Nouvel achat (autre plan…) : réinitialise l'état et la clé. */
  const reset = useCallback(() => {
    keyRef.current = newKey();
    setPayment(null);
    setError(null);
    setPhase('form');
  }, []);

  return { phase, payment, error, start, resume, retry, retryOnPaid, reset };
}

export type MobileMoneyPayment = ReturnType<typeof useMobileMoneyPayment>;
