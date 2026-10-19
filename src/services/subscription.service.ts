import api from '@/lib/api';
import { withMock } from '@/lib/mock';
import { mockMySubscriptions, mockPlans, mockSubscribe } from '@/mocks/subscription.mock';
import type { ApiResponse, Payment, Plan, PlanAudience, SubscribeInput, Subscription } from '@/types';

export const subscriptionService = {
  /** GET /plans?audience= — plans administrables (public). */
  plans(audience: PlanAudience) {
    return withMock(
      () => mockPlans(audience),
      async () => (await api.get<ApiResponse<Plan[]>>(`/plans?audience=${audience}`, { auth: false })).data,
    );
  },

  /** GET /subscriptions/me — mes abonnements actifs (auth). */
  mine() {
    return withMock(
      () => mockMySubscriptions(),
      async () => (await api.get<ApiResponse<Subscription[]>>(`/subscriptions/me`)).data,
    );
  },

  /** POST /payments/subscription { planCode, operator, payerPhone, idempotencyKey } — activation au webhook "paid". */
  subscribe(input: SubscribeInput) {
    return withMock(
      () => mockSubscribe(input),
      async () => (await api.post<ApiResponse<Payment>>(`/payments/subscription`, input, {
        headers: { 'Idempotency-Key': input.idempotencyKey },
      })).data,
    );
  },
};
