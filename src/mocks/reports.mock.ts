// mocks/reports.mock.ts — Signalements envoyés par les utilisateurs (alimentent la modération M16)
import type { AdminReport, ReportInput } from '@/types';
import { FEED_ITEMS } from './feed.mock';
import { persisted } from './storage';

const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const reportsStore = persisted<AdminReport[]>('ludra.mock.reports', () => [
  { id: 'rp-1', targetType: 'listing', targetId: 'l-003', targetLabel: 'Terrain titré 500 m² à Lendi', reason: 'arnaque', details: 'Demande un acompte avant la visite.', reporterName: 'Serge N.', createdAt: ago(3), status: 'open', reportsOnTarget: 3 },
  { id: 'rp-2', targetType: 'user', targetId: 'u-jp', targetLabel: 'Jean-Paul M.', reason: 'contenu_inapproprie', reporterName: 'Linda F.', createdAt: ago(9), status: 'open', reportsOnTarget: 1 },
  { id: 'rp-3', targetType: 'listing', targetId: 'l-004', targetLabel: 'Villa 4 chambres avec jardin à Bonapriso', reason: 'deja_loue', reporterName: 'Paul E.', createdAt: ago(20), status: 'open', reportsOnTarget: 1 },
  { id: 'rp-4', targetType: 'message', targetId: 'm-x', targetLabel: 'Message de « Plomberie Express »', reason: 'doublon', details: 'Spam répété.', reporterName: 'Aïcha M.', createdAt: ago(30), status: 'open', reportsOnTarget: 2 },
]);

const labelOf = (input: ReportInput) => {
  const item = FEED_ITEMS.find((i) => i.id === input.targetId);
  if (item) return item.title;
  const publisher = FEED_ITEMS.find((i) => i.publisher.id === input.targetId)?.publisher;
  return publisher?.name ?? input.targetId;
};

/** Enregistre un signalement utilisateur (POST /reports). */
export function recordReport(input: ReportInput) {
  const list = reportsStore.get();
  const same = list.filter((r) => r.targetId === input.targetId).length + 1;
  reportsStore.set([
    {
      id: `rp-${Date.now()}`, ...input, targetLabel: labelOf(input), reporterName: 'Vous',
      createdAt: new Date().toISOString(), status: 'open', reportsOnTarget: same,
    },
    ...list.map((r) => (r.targetId === input.targetId ? { ...r, reportsOnTarget: same } : r)),
  ]);
}
