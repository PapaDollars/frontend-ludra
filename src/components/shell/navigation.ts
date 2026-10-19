// Navigation V2.1 (dossier §3.1) — source unique pour top bar, rail gauche et nav basse.
import { Briefcase, Building2, CreditCard, Heart, Home, MessageCircle, PlusCircle, Search, User, Wrench, type LucideIcon } from 'lucide-react';
import URL from '@/utilis/url/url_front';

export interface NavItem {
  /** Clé i18n du libellé (namespace shell.nav). */
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** Préfixes de chemin considérés comme actifs. */
  match?: string[];
  /** Préfixes exclus (sous-pages ayant leur propre entrée). */
  exclude?: string[];
}

/** Onglets de la top bar desktop. */
export const TOP_TABS: NavItem[] = [
  { labelKey: 'shell.nav.home', href: URL.v2.feed, icon: Home },
  { labelKey: 'shell.nav.realEstate', href: URL.v2.immobilier, icon: Building2, match: ['/immobilier', '/annonces'] },
  { labelKey: 'shell.nav.personnel', href: URL.v2.personnel, icon: Briefcase, match: ['/personnel'] },
  { labelKey: 'shell.nav.services', href: URL.v2.services, icon: Wrench, match: ['/services'] },
];

/** Rail gauche desktop (≥ 1200 px). */
export const RAIL_ITEMS: NavItem[] = [
  { labelKey: 'shell.nav.home', href: URL.v2.feed, icon: Home },
  { labelKey: 'shell.nav.realEstate', href: URL.v2.immobilier, icon: Building2, match: ['/immobilier', '/annonces'] },
  { labelKey: 'shell.nav.staffPlacement', href: URL.v2.personnel, icon: Briefcase, match: ['/personnel'] },
  { labelKey: 'shell.nav.otherServices', href: URL.v2.services, icon: Wrench, match: ['/services'] },
  { labelKey: 'shell.nav.favorites', href: URL.v2.favorites, icon: Heart, match: ['/compte/favoris'] },
  { labelKey: 'shell.nav.messages', href: URL.v2.messages, icon: MessageCircle, match: ['/messages'] },
  { labelKey: 'shell.nav.payments', href: URL.v2.payments, icon: CreditCard, match: ['/compte/paiements'] },
  { labelKey: 'shell.nav.account', href: URL.v2.account, icon: User, match: ['/compte'], exclude: [URL.v2.favorites, URL.v2.payments] },
];

/** Navigation basse mobile (≤ 767 px). */
export const BOTTOM_ITEMS: NavItem[] = [
  { labelKey: 'shell.nav.home', href: URL.v2.feed, icon: Home },
  { labelKey: 'shell.nav.search', href: URL.v2.search, icon: Search, match: ['/recherche'] },
  { labelKey: 'shell.nav.publish', href: URL.v2.publish, icon: PlusCircle, match: ['/publier'] },
  { labelKey: 'shell.nav.messages', href: URL.v2.messages, icon: MessageCircle, match: ['/messages'] },
  { labelKey: 'shell.nav.accountShort', href: URL.v2.account, icon: User, match: ['/compte'] },
];

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export function isActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  if (item.href === '/') return pathname === '/';
  if (item.exclude?.some((p) => matches(pathname, p))) return false;
  return (item.match ?? [item.href]).some((p) => matches(pathname, p));
}
