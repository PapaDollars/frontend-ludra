'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, ListChecks, SlidersHorizontal, UserPlus } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { useRole } from '@/hooks/useRole';
import { useCursorList, useInfiniteSentinel } from '@/hooks/useCursorList';
import { activeFilterCount, cleanFilters, filtersFromQuery, filtersToQuery } from '@/lib/searchFilters';
import { searchService } from '@/services/search.service';
import type { CandidateFeedItem, SearchFilters, SearchOptions, SearchSort } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { Modal } from '@/components/ui/Modal';
import { SelectInput } from '@/components/ui/Form';
import { ChipTabs } from '@/views/feed/components/FeedTabs';
import { FeedSkeleton } from '@/views/feed/components/FeedSkeleton';

import { CandidateRow } from './components/CandidateRow';
import { PersonnelFilters } from './components/PersonnelFilters';
import { useRecruiterAccess } from './useRecruiterAccess';

const PAGE = 10;

const SORTS: { value: SearchSort; label: string }[] = [
  { value: 'pertinence', label: 'Pertinence' },
  { value: 'pertinence_pure', label: 'Pertinence seule (sans bonus de plan)' },
  { value: 'recent', label: 'Plus récents' },
];

function RecruiterCard({ planName, shortlistCount }: { planName: string | null; shortlistCount: number }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-navy mb-1">Pour recruteurs</h2>
      {planName ? (
        <>
          <p className="text-xs text-slate-500 mb-3">Forfait <strong className="text-navy">{planName}</strong> actif : contact et présélection ouverts.</p>
          <Link href={URL.v2.shortlist} className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand text-white text-sm font-semibold">
            <ListChecks className="w-4 h-4" /> Ma shortlist ({shortlistCount})
          </Link>
        </>
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-3">Activez un forfait pour accéder aux meilleurs profils et aux outils de présélection.</p>
          <Link href={URL.v2.recruiterPlans} className="flex h-9 items-center justify-center rounded-lg bg-brand text-white text-sm font-semibold">Voir les forfaits</Link>
        </>
      )}
    </section>
  );
}

/** Module 10 — Placement du personnel : marketplace candidats, même design social. */
export default function PersonnelPage() {
  const router = useRouter();
  const queryString = useSearchParams().toString();
  const { isAuthenticated } = useRole();
  const { access } = useRecruiterAccess(isAuthenticated);
  const [options, setOptions] = useState<SearchOptions | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => { searchService.getOptions().then(setOptions).catch(() => undefined); }, []);

  const filters = useMemo(() => {
    const params = new URLSearchParams(queryString);
    params.set('universe', 'personnel');
    return filtersFromQuery(params);
  }, [queryString]);
  const key = filtersToQuery(filters);

  const apply = useCallback((next: SearchFilters) => {
    const qs = new URLSearchParams(filtersToQuery(cleanFilters({ ...next, universe: 'personnel' })));
    qs.delete('universe');
    router.replace(`${URL.v2.personnel}${qs.toString() ? `?${qs}` : ''}`, { scroll: false });
  }, [router]);

  const fetchPage = useCallback((cursor: string | null) => searchService.search(filters, cursor, PAGE), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = useCursorList(fetchPage, key);
  const sentinel = useInfiniteSentinel(list.loadMore);
  const candidates = list.items as CandidateFeedItem[];

  const jobTabs = [{ value: '', label: 'Tous' }, ...(options?.jobs ?? []).map((j) => ({ value: j.value, label: j.label }))];
  const filterCount = activeFilterCount(filters) - (filters.job ? 1 : 0);

  const recruiterCard = <RecruiterCard planName={access?.planName ?? null} shortlistCount={access?.shortlistCount ?? 0} />;
  const filtersCard = (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-navy mb-3">Filtres rapides</h2>
      <PersonnelFilters idPrefix="rail" value={filters} onChange={apply} options={options} />
    </section>
  );

  return (
    <ShellColumns right={<>{recruiterCard}{filtersCard}</>}>
      <div className="flex flex-col gap-3 md:gap-4 pt-3 md:pt-0">
        <header className="px-4 md:px-0">
          <h1 className="text-xl font-bold text-navy">Placement du personnel</h1>
          <p className="text-sm text-slate-500">Chauffeurs, ménagères, cuisiniers, auxiliaires de vie — profils classés par pertinence puis visibilité.</p>
        </header>

        <div className="mx-4 md:mx-0 flex flex-wrap items-center gap-2 rounded-xl bg-perso-50 px-4 py-3 text-sm text-perso">
          <Briefcase className="w-4 h-4 shrink-0" />
          <span className="flex-1 min-w-[200px]">Vous cherchez un emploi ? Votre profil est gratuit.</span>
          <Link href={URL.v2.publish} className="inline-flex items-center gap-1 font-semibold underline"><UserPlus className="w-4 h-4" /> Créer mon profil</Link>
          <Link href={URL.v2.candidatePlans} className="font-semibold underline">Plans candidats</Link>
        </div>

        <ChipTabs tabs={jobTabs} value={filters.job ?? ''} onChange={(job) => apply({ ...filters, job: job || undefined })} label="Métiers" />

        <div className="flex items-center gap-2 px-4 md:px-0">
          <p className="text-sm font-semibold text-navy mr-auto" aria-live="polite">
            {list.total === null ? 'Recherche…' : `${list.total} profil${list.total > 1 ? 's' : ''}`}
          </p>
          <button type="button" onClick={() => setSheetOpen(true)} className="desk:hidden h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-navy">
            <SlidersHorizontal className="w-4 h-4" /> Filtres{filterCount > 0 && <span className="rounded-full bg-brand text-white text-[10px] px-1.5">{filterCount}</span>}
          </button>
          <label htmlFor="personnel-sort" className="sr-only">Trier par</label>
          <SelectInput id="personnel-sort" value={filters.sort ?? 'pertinence'} onChange={(e) => apply({ ...filters, sort: e.target.value as SearchSort })} className="!w-auto h-9 max-w-[200px]">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </SelectInput>
        </div>

        <div className="desk:hidden mx-4 md:mx-0">{recruiterCard}</div>

        <section aria-label="Candidats" aria-busy={list.loading} className="flex flex-col gap-3">
          {candidates.map((c) => <CandidateRow key={c.id} c={c} />)}
          {list.loading && <FeedSkeleton count={candidates.length ? 1 : 2} />}
          {!list.loading && !list.error && candidates.length === 0 && (
            <p className="mx-4 md:mx-0 rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">Aucun profil ne correspond. Élargissez les filtres.</p>
          )}
          {list.error && <p role="alert" className="mx-4 md:mx-0 text-sm text-red-600">{list.error} <button type="button" onClick={list.retry} className="underline">Réessayer</button></p>}
          <div ref={sentinel} />
        </section>
      </div>

      <Modal open={sheetOpen} onOpenChange={setSheetOpen} title="Filtres rapides"
        footer={<button type="button" onClick={() => setSheetOpen(false)} className="w-full h-11 rounded-lg bg-brand text-white text-sm font-semibold">Voir les {list.total ?? ''} profils</button>}>
        <PersonnelFilters idPrefix="sheet" value={filters} onChange={apply} options={options} />
      </Modal>
    </ShellColumns>
  );
}
