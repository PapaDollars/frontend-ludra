// utilis/format.ts — Formatage FR (prix FCFA, dates relatives, initiales)

const numberFmt = new Intl.NumberFormat('fr-FR');

export const formatAmount = (amount: number) => `${numberFmt.format(amount)} FCFA`;

const UNIT_LABEL: Record<string, string> = { mois: ' / mois', nuit: ' / nuit', total: '' };

export const formatPrice = (amount: number, unit: string = 'total') =>
  `${formatAmount(amount)}${UNIT_LABEL[unit] ?? ''}`;

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

export function timeAgo(iso: string): string {
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return "à l'instant";
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), 'day');
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** Séparateur de jour d'un fil : "Aujourd'hui", "Hier", "lun. 12 oct.". */
export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return "Aujourd'hui";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Horodatage court d'une liste : heure si aujourd'hui, sinon date. */
export const formatShortStamp = (iso: string) =>
  sameDay(new Date(iso), new Date()) ? formatClock(iso) : new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export const isSameDay = (a: string, b: string) => sameDay(new Date(a), new Date(b));
