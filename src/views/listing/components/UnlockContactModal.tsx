'use client';

import { MessageCircle } from 'lucide-react';
import type { ContactDetails } from '@/types';
import type { MobileMoneyPayment } from '@/hooks/useMobileMoneyPayment';
import { MobileMoneyCheckout } from '@/components/payment/MobileMoneyCheckout';
import { ContactReveal } from './ContactReveal';

interface UnlockContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  price: number;
  listingTitle: string;
  defaultPhone?: string;
  payment: MobileMoneyPayment;
  contact: ContactDetails | null;
}

/** M04 — Débloquer le contact direct (bottom sheet sur mobile). */
export function UnlockContactModal({ open, onOpenChange, price, listingTitle, defaultPhone, payment, contact }: UnlockContactModalProps) {
  return (
    <MobileMoneyCheckout
      open={open}
      onOpenChange={onOpenChange}
      payment={payment}
      title="Débloquer le contact direct"
      description="La messagerie interne reste gratuite. Le paiement révèle le téléphone et ouvre WhatsApp pour cette annonce."
      icon={(
        <span className="w-16 h-16 rounded-full bg-trust-50 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-trust" />
        </span>
      )}
      itemLabel="Accès contact pour cette annonce"
      amount={price}
      defaultPhone={defaultPhone}
      footnote="Paiement Mobile Money · le numéro reste masqué jusqu'à confirmation du paiement par l'opérateur."
      paidTitle="Contact débloqué"
      paidContent={(
        <>
          {contact ? <ContactReveal contact={contact} listingTitle={listingTitle} /> : <p className="text-center text-sm text-slate-400">Chargement du contact…</p>}
          <p className="text-xs text-slate-400 text-center">Retrouvez ce déblocage dans Mon compte › Paiements.</p>
        </>
      )}
    />
  );
}
