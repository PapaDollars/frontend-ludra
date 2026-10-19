import { useCallback } from 'react';
import { useMobileMoneyPayment } from '@/hooks/useMobileMoneyPayment';
import { paymentService } from '@/services/payment.service';
import { listingService } from '@/services/listing.service';
import type { ContactDetails, MobileMoneyInput } from '@/types';

/**
 * Déblocage du contact direct (M04).
 * Le numéro n'est demandé au serveur qu'après un paiement `paid` confirmé par webhook.
 */
export function useUnlockContact(listingId: string, onUnlocked: (c: ContactDetails) => void) {
  const create = useCallback(
    (input: MobileMoneyInput) => paymentService.unlockContact({ ...input, listingId }),
    [listingId],
  );
  const onPaid = useCallback(async () => {
    onUnlocked(await listingService.getContact(listingId));
  }, [listingId, onUnlocked]);
  return useMobileMoneyPayment(create, onPaid);
}
