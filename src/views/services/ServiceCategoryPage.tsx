'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { useCursorList, useInfiniteSentinel } from '@/hooks/useCursorList';
import { searchService } from '@/services/search.service';
import { servicesService } from '@/services/services.service';
import type { SearchOptions, SearchSort, ServiceCategory, ServiceFeedItem } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { SelectInput } from '@/components/ui/Form';
import { FeedSkeleton } from '@/views/feed/components/FeedSkeleton';
import { CategoryBadge, NotGuaranteedNote, ProviderRow, RegulatedNote, ServicesSafetyCard } from './components/ServiceParts';

/** Prestataires d'une catégorie : /services/[categorie]. */
export default function ServiceCategoryPage({ code }: { code: string }) {
  const [category, setCategory] = useState<ServiceCategory | null | undefined>(undefined);
  const [options, setOptions] = useState<SearchOptions | null>(null);
  const [city, setCity] = useState('');
  const [sort, setSort] = useState<SearchSort>('pertinence');

  useEffect(() => {
    servicesService.categories().then((list) => setCategory(list.find((c) => c.code === code) ?? null)).catch(() => setCategory(null));
    searchService.getOptions().then(setOptions).catch(() => undefined);
  }, [code]);

  const key = `${code}|${city}|${sort}`;
  const fetchPage = useCallback(
    (cursor: string | null) => searchService.search({ universe: 'services', category: code, city: city || undefined, sort }, cursor, 10),
    [code, city, sort],
  );
  const list = useCursorList(fetchPage, key);
  const sentinel = useInfiniteSentinel(list.loadMore);

  if (category === null) {
    return (
      <ShellColumns>
        <div className="mx-4 md:mx-0 mt-4 md:mt-0 bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <h1 className="text-xl font-bold text-navy mb-2">Catégorie indisponible</h1>
          <p className="text-sm text-slate-500 mb-6">Cette catégorie n&apos;existe pas ou n&apos;est pas encore ouverte.</p>
          <Link href={URL.v2.services} className="inline-flex h-10 px-5 items-center rounded-lg bg-brand text-white text-sm font-semibold">Tous les services</Link>
        </div>
      </ShellColumns>
    );
  }

  const providers = list.items as ServiceFeedItem[];

  return (
    <ShellColumns right={<ServicesSafetyCard />}>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <Link href={URL.v2.services} className="mx-4 md:mx-0 self-start inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy">
          <ArrowLeft className="w-4 h-4" /> Tous les services
        </Link>
        <header className="mx-4 md:mx-0 flex items-center gap-3">
          {category ? <CategoryBadge category={category} size="lg" /> : <span className="w-12 h-12 rounded-full bg-slate-200 animate-pulse" />}
          <div>
            <h1 className="text-xl font-bold text-navy">{category?.label ?? '…'}</h1>
            <p className="text-sm text-slate-500">{category?.description}</p>
          </div>
        </header>

        {category?.regulated && <RegulatedNote className="mx-4 md:mx-0" />}

        <div className="flex flex-wrap items-center gap-2 px-4 md:px-0">
          <p className="text-sm font-semibold text-navy mr-auto" aria-live="polite">
            {list.total === null ? 'Recherche…' : `${list.total} prestataire${list.total > 1 ? 's' : ''}`}
          </p>
          <label htmlFor="svc-city" className="sr-only">Ville</label>
          <SelectInput id="svc-city" value={city} onChange={(e) => setCity(e.target.value)} className="!w-auto h-9">
            <option value="">Toutes les villes</option>
            {options?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </SelectInput>
          <label htmlFor="svc-sort" className="sr-only">Trier par</label>
          <SelectInput id="svc-sort" value={sort} onChange={(e) => setSort(e.target.value as SearchSort)} className="!w-auto h-9">
            <option value="pertinence">Pertinence</option>
            <option value="recent">Plus récents</option>
            <option value="prix_asc">Tarif croissant</option>
          </SelectInput>
        </div>

        <section aria-label="Prestataires" aria-busy={list.loading} className="flex flex-col gap-3">
          {providers.map((s) => <ProviderRow key={s.id} s={s} />)}
          {list.loading && <FeedSkeleton count={providers.length ? 1 : 2} />}
          {!list.loading && !list.error && providers.length === 0 && (
            <p className="mx-4 md:mx-0 rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
              Aucun prestataire pour le moment{city ? ` à ${city}` : ''}. <Link href={URL.v2.publish} className="font-semibold text-brand underline">Proposer mon service</Link>
            </p>
          )}
          {list.error && <p role="alert" className="mx-4 md:mx-0 text-sm text-red-600">{list.error} <button type="button" onClick={list.retry} className="underline">Réessayer</button></p>}
          <div ref={sentinel} />
        </section>

        <NotGuaranteedNote className="mx-4 md:mx-0" />
      </div>
    </ShellColumns>
  );
}
