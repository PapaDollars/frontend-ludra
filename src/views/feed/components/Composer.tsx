'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import URL from '@/utilis/url/url_front';
import { useRole } from '@/hooks/useRole';
import { UserAvatar } from '@/components/ui/UserAvatar';

/** Barre "Que souhaitez-vous publier ou rechercher ?" (desktop/tablette). */
export function Composer() {
  const { t } = useTranslation();
  const { user } = useRole();

  return (
    <div className="hidden md:flex items-center gap-3 bg-white rounded-2xl border border-slate-200 p-3">
      <UserAvatar name={user?.name || 'Visiteur'} src={user?.avatar} size="sm" />
      <Link
        href={URL.v2.search}
        className="flex-1 h-10 rounded-full bg-surface px-4 flex items-center text-sm text-slate-500 hover:bg-slate-100"
      >
        {t('shell.feed.composer')}
      </Link>
      <Link
        href={URL.v2.publish}
        className="inline-flex items-center gap-1 h-9 px-4 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-600"
      >
        <Plus className="w-4 h-4" /> {t('shell.top.publish')}
      </Link>
    </div>
  );
}

/** Champ de recherche mobile sous le header compact. */
export function MobileSearchField() {
  const { t } = useTranslation();
  return (
    <Link
      href={URL.v2.search}
      className="md:hidden mx-4 mt-3 h-10 rounded-full bg-white border border-slate-200 px-4 flex items-center gap-2 text-sm text-slate-400"
    >
      <Search className="w-4 h-4" /> {t('shell.feed.mobileSearch')}
    </Link>
  );
}
