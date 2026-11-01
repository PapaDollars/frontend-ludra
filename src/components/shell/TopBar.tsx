'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LogOut, MessageCircle, Plus, Search, Settings, ShieldCheck, User } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { useRole } from '@/hooks/useRole';
import { useCounters } from '@/hooks/useCounters';
import { useLogout } from '@/hooks/useLogout';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { TOP_TABS, isActive } from './navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
}

/**
 * Top bar sticky (dossier §3.1).
 * Desktop : logo + recherche globale + onglets + "+ Publier" + messages + notifications + avatar.
 * Mobile : header compact logo + Publier (la recherche est rendue par la page).
 */
export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading, isAdmin } = useRole();
  const counters = useCounters(isAuthenticated);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `${URL.v2.search}?q=${encodeURIComponent(q)}` : URL.v2.search);
  };

  const onLogout = useLogout();

  return (
    <header className="print:hidden fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-[1320px] h-14 md:h-16 px-4 flex items-center gap-3 lg:gap-6">
        <MobileMenu isAuthenticated={isAuthenticated} />
        <Logo />

        {/* Recherche globale — tablette & desktop */}
        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-sm" role="search">
          <label className="relative w-full">
            <span className="sr-only">{t('shell.top.searchLabel')}</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('shell.top.searchPlaceholder')}
              className="w-full h-10 rounded-full bg-surface pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
        </form>

        {/* Onglets univers — desktop */}
        <nav className="hidden lg:flex items-stretch h-full gap-1" aria-label={t('shell.nav.universes')}>
          {TOP_TABS.map((tab) => {
            const active = isActive(tab, pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'px-3 flex items-center text-sm font-medium border-b-2 transition-colors',
                  active ? 'border-brand text-brand' : 'border-transparent text-slate-600 hover:text-navy',
                )}
              >
                {t(tab.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <Link
            href={URL.v2.publish}
            className="inline-flex items-center gap-1 h-9 px-3 md:px-4 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-600 transition-colors"
          >
            <Plus className="w-4 h-4 hidden md:block" />
            {t('shell.top.publish')}
          </Link>

          {isAuthenticated && (
            <>
              <Link href={URL.v2.messages} className="relative hidden md:flex w-9 h-9 items-center justify-center rounded-full hover:bg-surface text-slate-600" aria-label={t('shell.top.messagesAria', { count: counters.unreadMessages })}>
                <MessageCircle className="w-5 h-5" />
                <CountBadge count={counters.unreadMessages} />
              </Link>
              <NotificationBell unread={counters.unreadNotifications} onChange={counters.refresh} />
            </>
          )}

          {!isLoading && !isAuthenticated && (
            <Link href={URL.auth.login} className="hidden md:inline-flex h-9 px-4 items-center rounded-lg border border-slate-200 text-sm font-medium text-navy hover:bg-surface">
              {t('shell.top.login')}
            </Link>
          )}

          {isAuthenticated && user && (
            <div className="relative hidden md:block" ref={menuRef}>
              <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen} className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-200">
                <UserAvatar name={user.name || 'Moi'} src={user.avatar} size="sm" />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-slate-100 py-2 text-sm">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-semibold text-navy truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Link role="menuitem" href={URL.v2.account} className="flex items-center gap-2 px-4 py-2 hover:bg-surface text-slate-700"><User className="w-4 h-4" /> {t('shell.menu.account')}</Link>
                  <Link role="menuitem" href={URL.v2.certification} className="flex items-center gap-2 px-4 py-2 hover:bg-surface text-slate-700"><ShieldCheck className="w-4 h-4" /> {t('shell.menu.certification')}</Link>
                  {isAdmin && (
                    <Link role="menuitem" href={URL.admin.dashboard} className="flex items-center gap-2 px-4 py-2 hover:bg-surface text-slate-700"><Settings className="w-4 h-4" /> {t('shell.menu.backoffice')}</Link>
                  )}
                  <button role="menuitem" type="button" onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600"><LogOut className="w-4 h-4" /> {t('shell.menu.logout')}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
