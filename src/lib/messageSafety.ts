// lib/messageSafety.ts — Détection des coordonnées / liens dans un message (M05).
// Côté front : simple avertissement avant envoi. Le serveur reste seul juge (masquage réel).

const PHONE = /(?:\+?\d[\d\s.-]{7,}\d)/;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const LINK = /(?:https?:\/\/|www\.)\S+/i;

export interface ContactInfoFound {
  phone: boolean;
  email: boolean;
  link: boolean;
}

export function detectContactInfo(text: string): ContactInfoFound {
  return { phone: PHONE.test(text), email: EMAIL.test(text), link: LINK.test(text) };
}

export const hasContactInfo = (f: ContactInfoFound) => f.phone || f.email || f.link;

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MESSAGE_MAX_LENGTH = 2000;

/** Erreur lisible si l'image n'est pas acceptée, sinon null. */
export function validateImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Formats acceptés : JPG, PNG ou WebP.';
  if (file.size > IMAGE_MAX_BYTES) return 'Image trop lourde (5 Mo maximum).';
  return null;
}

/** Masquage appliqué par le serveur (reproduit dans les mocks). */
export function maskContactInfo(text: string): { text: string; masked: boolean; linkBlocked: boolean } {
  let masked = false;
  let linkBlocked = false;
  let out = text.replace(new RegExp(LINK.source, 'gi'), () => { linkBlocked = true; return '[lien retiré]'; });
  out = out.replace(new RegExp(EMAIL.source, 'gi'), () => { masked = true; return '[coordonnée masquée]'; });
  out = out.replace(new RegExp(PHONE.source, 'g'), () => { masked = true; return '[coordonnée masquée]'; });
  return { text: out, masked, linkBlocked };
}
