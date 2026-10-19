'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { formatAmount } from '@/utilis/format';
import { useMobileMoneyPayment } from '@/hooks/useMobileMoneyPayment';
import { subscriptionService } from '@/services/subscription.service';
import type { MobileMoneyInput, Plan, PlanAudience, Subscription } from '@/types';
import { MobileMoneyCheckout } from '@/components/payment/MobileMoneyCheckout';

interface UsePlansOptions {
  enabled: boolean;
  defaultPhone?: string;
  /** Appelé après activation confirmée (rafraîchir des droits…). */
  onActivated?: () => Promise<void> | void;
  /** Contenu additionnel après paiement. */
  paidExtra?: (plan: Plan) => ReactNode;
  /** Note sous le formulaire de paiement. */
  footnote?: (plan: Plan, current: Subscription | null) => string | undefined;
}

/**
 * Plans d'une audience + abonnement actif + paiement Mobile Money.
 * Utilisé par les pages propriétaire/agent (M08), candidats (M12) et recruteurs (M13).
 */
export function usePlans(audience: PlanAudience, { enabled, defaultPhone, onActivated, paidExtra, footnote }: UsePlansOptions) {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [current, setCurrent] = useState<Subscription | null>(null);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const subs = await subscriptionService.mine();
    setCurrent(subs.find((s) => s.audience === audience) ?? null);
  }, [audience]);

  useEffect(() => {
    if (!enabled) return;
    subscriptionService.plans(audience)
      .then((p) => setPlans([...p].sort((a, b) => a.rank - b.rank)))
      .catch((e) => setError(e instanceof Error ? e.message : 'Plans indisponibles.'));
    refresh().catch(() => undefined);
  }, [enabled, audience, refresh]);

  const create = useCallback(
    (input: MobileMoneyInput) => subscriptionService.subscribe({ ...input, planCode: selected!.code }),
    [selected],
  );
  const payment = useMobileMoneyPayment(create, async () => {
    await refresh();
    await onActivated?.();
  });

  const choose = useCallback((plan: Plan) => {
    payment.reset();
    setSelected(plan);
  }, [payment]);

  const checkout = selected && (
    <MobileMoneyCheckout
      open
      onOpenChange={(o) => { if (!o) setSelected(null); }}
      payment={payment}
      title={`${selected.period === 'month' ? 'Abonnement' : 'Plan'} ${selected.name}`}
      description="Paiement par Mobile Money. Activation dès confirmation de l'opérateur."
      itemLabel={`${selected.name} · ${selected.period === 'month' ? '1 mois' : `${selected.durationDays} jours`}`}
      amount={selected.price}
      amountSuffix={selected.period === 'month' ? ' / mois' : ''}
      defaultPhone={defaultPhone}
      footnote={footnote?.(selected, current) ?? (current && current.planCode !== selected.code ? `Remplace votre plan ${current.planName} dès l'activation.` : undefined)}
      paidTitle={`${selected.name} activé`}
      paidContent={(
        <div className="text-center text-sm text-slate-600">
          <p>Merci ! Avantages actifs pour {selected.durationDays} jours ({formatAmount(selected.price)}).</p>
          {paidExtra?.(selected)}
        </div>
      )}
    />
  );

  return { plans, current, error, choose, checkout, refresh };
}
