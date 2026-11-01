'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { DRAWER_ITEMS, isActive } from './navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LogoImage } from './Logo';

/**
 * Menu ☰ des écrans sans rail gauche (< 1200 px) : mêmes entrées que le rail,
 * pages secondaires et choix de la langue. Se ferme à chaque changement de page.
 */
export function MobileMenu({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={t('shell.menu.open')}
          className="desk:hidden -ml-2 w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-navy hover:bg-surface"
        >
          <Menu className="w-5 h-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[300px] bg-white shadow-xl flex flex-col pb-[env(safe-area-inset-bottom)] focus:outline-none"
        >
          <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100">
            <Dialog.Title className="sr-only">{t('shell.menu.title')}</Dialog.Title>
            <LogoImage />
            <Dialog.Close aria-label={t('shell.menu.close')} className="w-9 h-9 -mr-2 flex items-center justify-center rounded-lg text-slate-500 hover:bg-surface">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <nav aria-label={t('shell.nav.main')} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
            {DRAWER_ITEMS.map((item) => {
              const active = isActive(item, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 h-11 text-[15px] transition-colors',
                    active ? 'bg-brand-50 text-brand font-semibold' : 'text-slate-700 hover:bg-surface',
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  {t(item.labelKey)}
                </Link>
              );
            })}

            {!isAuthenticated && (
              <div className="mt-3 grid grid-cols-2 gap-2 px-1">
                <Link href={URL.auth.login} onClick={() => setOpen(false)} className="h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-navy hover:bg-surface">
                  {t('shell.top.login')}
                </Link>
                <Link href={URL.auth.register} onClick={() => setOpen(false)} className="h-10 inline-flex items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand-700">
                  {t('shell.menu.signup')}
                </Link>
              </div>
            )}
          </nav>

          <div className="px-4 py-4 border-t border-slate-100 flex flex-col gap-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <Link href={URL.v2.about} onClick={() => setOpen(false)} className="hover:text-navy">{t('shell.footer.about')}</Link>
              <Link href={URL.v2.help} onClick={() => setOpen(false)} className="hover:text-navy">{t('shell.footer.help')}</Link>
              <span>© {new Date().getFullYear()} LUDRA</span>
            </div>
            <LanguageSwitcher className="self-start" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
