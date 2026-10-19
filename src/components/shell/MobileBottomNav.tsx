'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utilis/utils';
import { BOTTOM_ITEMS, isActive } from './navigation';

/** Navigation basse persistante (mobile ≤ 767 px). */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t('shell.nav.mobile')}
      className="print:hidden md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 h-16 text-[11px]',
                  active ? 'text-brand font-semibold' : 'text-slate-500',
                )}
              >
                <Icon className="w-5 h-5" />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
