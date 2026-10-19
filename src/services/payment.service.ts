import api from '@/lib/api';
import { withMock } from '@/lib/mock';
import { mockCreateUnlock } from '@/mocks/listing.mock';
import { mockGetPayment } from '@/mocks/payment.mock';
import type { ApiResponse, Payment, UnlockContactInput } from '@/types';

export const paymentService = {
  /**
   * POST /payments/unlock-contact — auth.
   * Lance la demande Mobile Money (push USSD). Renvoie le paiement `pending`,
   * ou `paid` directement si le contact est déjà débloqué (aucun nouveau débit).
   */
  unlockContact(input: UnlockContactInput) {
    return withMock(
      () => mockCreateUnlock(input),
      async () => (await api.post<ApiResponse<Payment>>(`/payments/unlock-contact`, input, {
        headers: { 'Idempotency-Key': input.idempotencyKey },
      })).data,
    );
  },

  /** GET /payments/:id — auth ; statut mis à jour par le webhook opérateur. */
  getById(id: string) {
    return withMock(
      () => mockGetPayment(id),
      async () => (await api.get<ApiResponse<Payment>>(`/payments/${encodeURIComponent(id)}`)).data,
    );
  },
};
