'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Bell, CreditCard, Flag, MessageCircle, Search, Sparkles, Star, type LucideIcon } from 'lucide-react';

import { cn } from '@/utilis/utils';
import { timeAgo } from '@/utilis/format';
import { notificationService } from '@/services/notification.service';
import type { AppNotification, NotificationKind } from '@/types';

const ICON: Record<NotificationKind, [LucideIcon, string]> = {
  message: [MessageCircle, 'text-trust bg-trust-50'],
  search_alert: [Search, 'text-brand bg-brand-50'],
  review: [Star, 'text-amber-500 bg-amber-50'],
  kyc: [BadgeCheck, 'text-brand bg-brand-50'],
  payment: [CreditCard, 'text-caution bg-caution-50'],
  listing: [Flag, 'text-red-600 bg-red-50'],
  subscription: [Sparkles, 'text-perso bg-perso-50'],
  system: [Bell, 'text-slate-500 bg-slate-100'],
};

/** Notifications + actions « lu » ; `limit` réduit la liste (panneau du header). */
export function useNotifications(enabled: boolean, limit = 20) {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);

  const load = useCallback(async (from: string | null = null) => {
    try {
      const page = await notificationService.list(from, limit);
      setItems((prev) => (from ? [...(prev ?? []), ...page.items] : page.items));
      setUnread(page.unread);
      setCursor(page.nextCursor);
    } catch { setItems((prev) => prev ?? []); }
  }, [limit]);

  useEffect(() => { if (enabled) load(); }, [enabled, load]);

  const markRead = useCallback(async (n: AppNotification) => {
    if (n.read) return;
    setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null);
    setUnread((u) => Math.max(0, u - 1));
    notificationService.markRead(n.id).catch(() => undefined);
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev?.map((x) => ({ ...x, read: true })) ?? null);
    setUnread(0);
    await notificationService.markAllRead().catch(() => undefined);
  }, []);

  return { items, unread, hasMore: !!cursor, loadMore: () => load(cursor), reload: () => load(), markRead, markAllRead };
}

interface NotificationListProps {
  items: AppNotification[] | null;
  onOpen: (n: AppNotification) => void;
  compact?: boolean;
}

export function NotificationList({ items, onOpen, compact }: NotificationListProps) {
  const { t } = useTranslation();
  if (items === null) return <p className="p-6 text-center text-sm text-slate-400">{t('shell.bell.loading')}</p>;
  if (items.length === 0) return <p className="p-6 text-center text-sm text-slate-500">{t('shell.bell.empty')}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((n) => {
        const [Icon, tone] = ICON[n.kind];
        const body = (
          <>
            <span className={cn('w-9 h-9 shrink-0 rounded-full flex items-center justify-center', tone)}><Icon className="w-4 h-4" /></span>
            <span className="min-w-0 flex-1">
              <span className={cn('block text-sm text-navy', !n.read && 'font-semibold')}>{n.title}</span>
              <span className={cn('block text-xs text-slate-500', compact && 'truncate')}>{n.body}</span>
              <span className="block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
            </span>
            {!n.read && <span className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-brand" aria-label={t('shell.bell.unread')} />}
          </>
        );
        const cls = cn('flex items-start gap-3 px-4 py-3 text-left w-full hover:bg-surface', !n.read && 'bg-brand-50/40');
        return (
          <li key={n.id}>
            {n.href
              ? <Link href={n.href} onClick={() => onOpen(n)} className={cls}>{body}</Link>
              : <button type="button" onClick={() => onOpen(n)} className={cls}>{body}</button>}
          </li>
        );
      })}
    </ul>
  );
}
