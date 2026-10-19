'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { RAIL_ITEMS, isActive } from './navigation';
import { LanguageSwitcher } from './LanguageSwitcher';

/** Rail gauche desktop (≥ 1200 px) — dossier §3, maquette M01. */
export function LeftRail() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav aria-label={t('shell.nav.main')} className="sticky top-20 flex flex-col gap-1">
      {RAIL_ITEMS.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              active ? 'bg-brand-50 text-brand font-semibold' : 'text-slate-600 hover:bg-white hover:text-navy',
            )}
          >
            <Icon className="w-[18px] h-[18px]" />
            {t(item.labelKey)}
          </Link>
        );
      })}

      {/* Pages secondaires : hors du feed (§3.1) */}
      <div className="mt-6 px-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <Link href={URL.v2.about} className="hover:text-slate-600">{t('shell.footer.about')}</Link>
        <Link href={URL.v2.help} className="hover:text-slate-600">{t('shell.footer.help')}</Link>
        <span>© {new Date().getFullYear()} LUDRA</span>
      </div>
      <LanguageSwitcher className="mt-3 mx-3 self-start" />
    </nav>
  );
}
