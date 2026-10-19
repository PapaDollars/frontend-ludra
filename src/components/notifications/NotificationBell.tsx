'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Popover from '@radix-ui/react-popover';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { NotificationList, useNotifications } from './NotificationList';

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
}

/** Cloche : panneau sur desktop, page /notifications sur mobile. */
export function NotificationBell({ unread, onChange }: { unread: number; onChange: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const n = useNotifications(open, 6);
  const label = t('shell.top.notificationsAria', { count: unread });

  return (
    <>
      <Link href={URL.v2.notifications} aria-label={label} className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface text-slate-600">
        <Bell className="w-5 h-5" />
        <Badge count={unread} />
      </Link>

      <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) onChange(); }}>
        <Popover.Trigger aria-label={label} className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-full hover:bg-surface text-slate-600">
          <Bell className="w-5 h-5" />
          <Badge count={unread} />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="end" sideOffset={8} className="z-50 w-[360px] max-h-[70vh] overflow-hidden flex flex-col rounded-2xl border border-slate-100 bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="font-semibold text-navy">{t('shell.bell.title')}</p>
              {n.unread > 0 && <button type="button" onClick={async () => { await n.markAllRead(); onChange(); }} className="text-xs font-semibold text-brand hover:underline">{t('shell.bell.markAll')}</button>}
            </div>
            <div className="overflow-y-auto">
              <NotificationList compact items={n.items} onOpen={(x) => { n.markRead(x); setOpen(false); onChange(); }} />
            </div>
            <Link href={URL.v2.notifications} onClick={() => setOpen(false)} className="block border-t border-slate-100 py-2.5 text-center text-sm font-semibold text-brand hover:bg-surface">
              {t('shell.bell.seeAll')}
            </Link>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}
