'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/utilis/utils';
import type { FeedFilter, Universe } from '@/types';

export interface ChipTab<T extends string> {
  value: T;
  label: string;
  /** Libellé court mobile. */
  short?: string;
}

interface ChipTabsProps<T extends string> {
  tabs: ChipTab<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** Puces d'onglets défilables, sans recharger la page. */
export function ChipTabs<T extends string>({ tabs, value, onChange, label }: ChipTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-2 overflow-x-auto px-4 md:px-0 no-scrollbar">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors',
              active ? 'bg-brand text-white' : 'bg-white md:bg-transparent text-slate-600 hover:bg-white hover:text-navy',
            )}
          >
            <span className="md:hidden">{tab.short ?? tab.label}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const UNIVERSE_TABS: ChipTab<Universe>[] = [
  { value: 'immobilier', label: 'Immobilier', short: 'Immo' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'services', label: 'Services' },
];

/** Filtres du feed (navigation, traduits avec le shell). */
export function FeedTabs({ value, onChange }: { value: FeedFilter; onChange: (value: FeedFilter) => void }) {
  const { t } = useTranslation();
  const tabs: ChipTab<FeedFilter>[] = [
    { value: 'tous', label: t('shell.feed.all') },
    { value: 'immobilier', label: t('shell.nav.realEstate'), short: t('shell.feed.realEstateShort') },
    { value: 'personnel', label: t('shell.nav.personnel') },
    { value: 'services', label: t('shell.nav.services') },
  ];
  return <ChipTabs tabs={tabs} value={value} onChange={onChange} label={t('shell.feed.filterLabel')} />;
}
