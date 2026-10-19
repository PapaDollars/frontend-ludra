'use client';

import { useRouter } from 'next/navigation';

import URL from '@/utilis/url/url_front';
import type { FeedFilter } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';

import { useFeed } from './useFeed';
import { FeedList } from './components/FeedList';
import { FeedTabs } from './components/FeedTabs';
import { Composer, MobileSearchField } from './components/Composer';
import { SafetyCard, VerifiedAccountsCard } from './components/RightRail';

const FILTER_ROUTE: Record<FeedFilter, string> = {
  tous: URL.v2.feed,
  immobilier: URL.v2.immobilier,
  personnel: URL.v2.personnel,
  services: URL.v2.services,
};

/**
 * Module 01 — Accueil / Feed.
 * Premier contenu visible = offre réelle (pas de hero marketing).
 */
export default function FeedPage({ filter = 'tous' }: { filter?: FeedFilter }) {
  const router = useRouter();
  const feed = useFeed(filter);

  return (
    <ShellColumns right={<><SafetyCard /><VerifiedAccountsCard universe={filter === 'tous' ? undefined : filter} /></>}>
      <div className="flex flex-col gap-3 md:gap-4">
        <MobileSearchField />
        <Composer />
        <FeedTabs value={filter} onChange={(f) => router.push(FILTER_ROUTE[f])} />
        <FeedList {...feed} />
      </div>
    </ShellColumns>
  );
}
