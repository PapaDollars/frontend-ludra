'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, BadgeCheck, Building2, CreditCard, Flag, LayoutDashboard, ScrollText, Settings, UserCheck, Users, type LucideIcon,
} from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { hasPermission } from '@/lib/adminPermissions';
import { useRole } from '@/hooks/useRole';
import { LogoImage } from '@/components/shell/Logo';
import type { AdminPermission } from '@/types';

interface AdminNavItem {
  /** Clé i18n (shell.admin). */
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** Permission requise pour voir l'entrée (aucune = tout admin). */
  perm?: AdminPermission;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { labelKey: 'shell.admin.dashboard', href: URL.admin.dashboard, icon: LayoutDashboard },
  { labelKey: 'shell.admin.listings', href: URL.admin.listings, icon: Building2, perm: 'manage_properties' },
  { labelKey: 'shell.admin.kyc', href: URL.admin.kyc, icon: BadgeCheck, perm: 'review_kyc' },
  { labelKey: 'shell.admin.payments', href: URL.admin.payments, icon: CreditCard, perm: 'view_payments' },
  { labelKey: 'shell.admin.reports', href: URL.admin.reports, icon: Flag, perm: 'handle_reports' },
  { labelKey: 'shell.admin.proofs', href: URL.admin.proofs, icon: UserCheck, perm: 'review_kyc' },
  { labelKey: 'shell.admin.users', href: URL.admin.users, icon: Users, perm: 'manage_users' },
  { labelKey: 'shell.admin.settings', href: URL.admin.settings, icon: Settings, perm: 'manage_settings' },
  { labelKey: 'shell.admin.audit', href: URL.admin.audit, icon: ScrollText, perm: 'view_audit' },
];

/** Coque back-office : barre latérale sombre (desktop), onglets défilables (mobile). */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user } = useRole();
  const items = ADMIN_NAV.filter((i) => !i.perm || hasPermission(user, i.perm) || (i.perm === 'handle_reports' && hasPermission(user, 'moderate_reviews')));
  const active = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 bg-navy text-slate-300 sticky top-0 h-screen">
        <div className="px-5 py-5">
          <LogoImage variant="light" className="md:h-6" />
          <p className="mt-1 text-[10px] font-semibold tracking-widest text-brand-200">ADMIN</p>
        </div>
        <nav aria-label={t('shell.admin.nav')} className="flex-1 px-3 flex flex-col gap-1">
          {items.map(({ labelKey, href, icon: Icon }) => (
            <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}
              className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition', active(href) ? 'bg-brand-500 text-white font-semibold' : 'hover:bg-navy-light hover:text-white')}>
              <Icon className="w-4 h-4" /> {t(labelKey)}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-xs">
          <p className="text-white font-medium truncate">{user?.name}</p>
          <p className="text-slate-400">{user?.role === 'proprietaire' ? t('shell.admin.mainAccount') : t('shell.admin.administrator')}</p>
          <Link href={URL.v2.feed} className="mt-2 inline-flex items-center gap-1 text-brand-200 hover:text-white"><ArrowLeft className="w-3.5 h-3.5" /> {t('shell.admin.backToSite')}</Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-navy text-white">
          <div className="flex items-center justify-between px-4 h-12">
            <span className="flex items-center gap-2"><LogoImage variant="light" className="md:h-5" /><span className="text-[10px] font-semibold tracking-widest text-brand-200">ADMIN</span></span>
            <Link href={URL.v2.feed} className="text-xs text-brand-200">{t('shell.admin.backToSite')}</Link>
          </div>
          <nav aria-label={t('shell.admin.nav')} className="flex gap-1 overflow-x-auto no-scrollbar px-2 pb-2">
            {items.map(({ labelKey, href }) => (
              <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}
                className={cn('shrink-0 rounded-full px-3 py-1 text-xs', active(href) ? 'bg-brand-500 text-white font-semibold' : 'text-slate-300 bg-white/5')}>
                {t(labelKey)}
              </Link>
            ))}
          </nav>
        </header>
        <main className="p-4 lg:p-8 max-w-[1200px]">{children}</main>
      </div>
    </div>
  );
}
