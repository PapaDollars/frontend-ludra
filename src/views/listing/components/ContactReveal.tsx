import { Phone } from 'lucide-react';
import type { ContactDetails } from '@/types';

const digits = (s: string) => s.replace(/\D/g, '');

export const whatsappUrl = (number: string, listingTitle: string) =>
  `https://wa.me/${digits(number)}?text=${encodeURIComponent(`Bonjour, je vous contacte au sujet de votre annonce « ${listingTitle} » vue sur LUDRA.`)}`;

/** Coordonnées débloquées : appel + WhatsApp. */
export function ContactReveal({ contact, listingTitle }: { contact: ContactDetails; listingTitle: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-lg font-bold text-navy tracking-wide">{contact.phone}</p>
      <div className="flex gap-2">
        <a
          href={`tel:${contact.phone.replace(/\s/g, '')}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-lg border border-brand text-brand text-sm font-semibold hover:bg-brand-50"
        >
          <Phone className="w-4 h-4" /> Appeler
        </a>
        {contact.whatsapp && (
          <a
            href={whatsappUrl(contact.whatsapp, listingTitle)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center h-10 rounded-lg bg-trust text-white text-sm font-semibold hover:opacity-90"
          >
            Ouvrir WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
