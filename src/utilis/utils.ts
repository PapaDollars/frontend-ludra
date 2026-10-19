// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
/** Propose l'enregistrement d'un fichier généré côté client. */
export function saveBlob(blob: Blob, filename: string) {
  const url = globalThis.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => globalThis.URL.revokeObjectURL(url), 1000);
}
