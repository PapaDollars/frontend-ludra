'use client';

import { Loader2 } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { NotificationList, useNotifications } from '@/components/notifications/NotificationList';

/** Toutes les notifications (page dédiée sur mobile, « Voir tout » sur desktop). */
export default function NotificationsPage() {
  const { ready } = useRequireAuth();
  const n = useNotifications(ready);

  if (!ready) return <ShellColumns><div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div></ShellColumns>;

  return (
    <ShellColumns>
      <div className="flex flex-col gap-3 pt-3 md:pt-0">
        <header className="mx-4 md:mx-0 flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-navy">Notifications</h1>
          {n.unread > 0 && <button type="button" onClick={n.markAllRead} className="text-sm font-semibold text-brand hover:underline">Tout marquer comme lu</button>}
        </header>
        <section aria-label="Notifications" className="bg-white md:rounded-2xl border-y md:border border-slate-200 overflow-hidden">
          <NotificationList items={n.items} onOpen={n.markRead} />
        </section>
        {n.hasMore && <button type="button" onClick={n.loadMore} className="self-center h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-navy">Plus anciennes</button>}
        <p className="mx-4 md:mx-0 text-[11px] text-slate-400">Choisissez ce que vous recevez dans Mon compte › Paramètres › Notifications.</p>
      </div>
    </ShellColumns>
  );
}
