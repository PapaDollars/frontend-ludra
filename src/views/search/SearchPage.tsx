'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, SlidersHorizontal } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { useRole } from '@/hooks/useRole';
import { searchService } from '@/services/search.service';
import {
  activeFilterCount, cleanFilters, filtersFromQuery, filtersToQuery, resetPanel,
} from '@/lib/searchFilters';
import type { SavedSearch, SearchFilters, SearchOptions, SearchSort, SearchSuggestion, Universe } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { Modal } from '@/components/ui/Modal';
import { SelectInput } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { ChipTabs, UNIVERSE_TABS } from '@/views/feed/components/FeedTabs';

import { SearchBox } from './components/SearchBox';
import { FiltersForm } from './components/FiltersForm';
import { SearchResults } from './components/SearchResults';
import { SaveSearchDialog, SavedSearchesBar } from './components/SavedSearches';
import { useSavedSearches } from './useSavedSearches';
import { describeFilters } from './describeFilters';

/** Dernière recherche, restaurée quand on revient sur /recherche sans paramètres. */
const LAST_SEARCH_KEY = 'ludra.search.last';

const PANEL_TITLE: Record<Universe, [string, string]> = {
  immobilier: ['Rechercher un bien', 'offre'],
  personnel: ['Rechercher un profil', 'profil'],
  services: ['Rechercher un prestataire', 'prestataire'],
};

const SORTS: { value: SearchSort; label: string }[] = [
  { value: 'pertinence', label: 'Pertinence' },
  { value: 'recent', label: 'Plus récents' },
  { value: 'prix_asc', label: 'Prix croissant' },
  { value: 'prix_desc', label: 'Prix décroissant' },
];

const plural = (n: number, word: string) => `${n.toLocaleString('fr-FR')} ${word}${n > 1 ? 's' : ''}`;

/**
 * Module 02 — Recherche & filtres.
 * L'URL est la source de vérité des filtres appliqués (partage, retour arrière) ;
 * le panneau édite un brouillon dont le nombre de résultats est mis à jour en direct.
 */
export default function SearchPage() {
  const router = useRouter();
  const queryString = useSearchParams().toString();
  const { isAuthenticated } = useRole();
  const { show: showToast, node: toastNode } = useToast();

  const applied = useMemo(() => filtersFromQuery(new URLSearchParams(queryString)), [queryString]);
  const appliedKey = filtersToQuery(applied);

  const [options, setOptions] = useState<SearchOptions | null>(null);
  const [draft, setDraft] = useState<SearchFilters>(applied);
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { saved, create, toggleAlert, remove } = useSavedSearches(isAuthenticated);

  // ── Restauration / mémorisation de la dernière recherche ──
  useEffect(() => {
    if (queryString) { setRestoring(false); return; }
    let last: string | null = null;
    try { last = sessionStorage.getItem(LAST_SEARCH_KEY); } catch { /* stockage indisponible */ }
    if (last) router.replace(`${URL.v2.search}?${last}`, { scroll: false });
    else setRestoring(false);
  }, [queryString, router]);

  useEffect(() => {
    if (restoring) return;
    try { sessionStorage.setItem(LAST_SEARCH_KEY, appliedKey); } catch { /* stockage indisponible */ }
  }, [appliedKey, restoring]);

  useEffect(() => {
    searchService.getOptions().then(setOptions).catch(() => showToast('Filtres indisponibles pour le moment'));
  }, [showToast]);

  // Le brouillon suit les filtres appliqués (navigation, recherche sauvegardée…)
  useEffect(() => setDraft(applied), [appliedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compteur live "Afficher N offres"
  const draftKey = filtersToQuery(draft);
  useEffect(() => {
    let cancelled = false;
    setDraftCount(null);
    const t = setTimeout(() => {
      searchService.count(cleanFilters(draft))
        .then((r) => { if (!cancelled) setDraftCount(r.total); })
        .catch(() => { /* le bouton reste utilisable sans compteur */ });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [draftKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = useCallback((next: SearchFilters, scrollToResults = false) => {
    router.replace(`${URL.v2.search}?${filtersToQuery(next)}`, { scroll: false });
    setSheetOpen(false);
    if (scrollToResults) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [router]);

  const onPickSuggestion = (s: SearchSuggestion) => apply(cleanFilters({ ...applied, q: undefined, ...s.filters }));
  const onReset = () => { const r = resetPanel(applied); setDraft(r); apply(r); };
  const onApplySaved = (s: SavedSearch) => apply(s.filters, true);

  const onSaveClick = () => {
    if (!isAuthenticated) {
      router.push(URL.auth.loginThen(`${URL.v2.search}?${appliedKey}`));
      return;
    }
    setSaveOpen(true);
  };

  const guard = (fn: (s: SavedSearch) => Promise<void>) => (s: SavedSearch) =>
    fn(s).catch((e: Error) => showToast(e.message));

  const [panelTitle, unit] = PANEL_TITLE[applied.universe];
  const dirty = draftKey !== appliedKey;
  const filterCount = activeFilterCount(applied);
  const applyLabel = draftCount === null ? 'Afficher les résultats' : `Afficher ${plural(draftCount, unit)}`;

  const applyButton = (className?: string) => (
    <button
      type="button"
      onClick={() => apply(draft, true)}
      className={cn('h-11 px-5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-600 transition', dirty && 'ring-4 ring-accent-100', className)}
    >
      {applyLabel}
    </button>
  );
  const resetButton = (
    <button type="button" onClick={onReset} className="h-11 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface">
      Réinitialiser
    </button>
  );

  return (
    <ShellColumns>
      <div className="flex flex-col gap-3 md:gap-4 pt-3 md:pt-0">
        <div className="px-4 md:px-0">
          <h1 className="hidden md:block text-xl font-bold text-navy mb-3">Recherche</h1>
          <SearchBox value={applied.q ?? ''} onSubmit={(q) => apply({ ...applied, q: q || undefined })} onPickSuggestion={onPickSuggestion} />
        </div>

        <ChipTabs
          tabs={UNIVERSE_TABS}
          value={applied.universe}
          onChange={(u) => apply(cleanFilters({ ...applied, universe: u }))}
          label="Univers de recherche"
        />

        <SavedSearchesBar saved={saved} onApply={onApplySaved} onToggleAlert={guard(toggleAlert)} onRemove={guard(remove)} />

        {/* Panneau de filtres — tablette & desktop */}
        <section aria-labelledby="filters-title" className="hidden md:block bg-white rounded-2xl border border-slate-200 p-5">
          <div className="mb-4">
            <h2 id="filters-title" className="text-lg font-semibold text-navy">{panelTitle}</h2>
            <p className="text-xs text-slate-500">Filtres rapides, résultats immédiats, recherches sauvegardables.</p>
          </div>
          <FiltersForm idPrefix="desk" value={draft} onChange={setDraft} options={options} />
          <div className="flex items-center justify-end gap-2 mt-5">
            {resetButton}
            {applyButton()}
          </div>
        </section>

        {/* Bouton filtres — mobile */}
        <div className="md:hidden px-4">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-navy"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres{filterCount > 0 && <span className="rounded-full bg-brand text-white text-[11px] px-1.5">{filterCount}</span>}
          </button>
        </div>

        <div ref={resultsRef} className="scroll-mt-20">
          {!restoring && (
            <SearchResults
              filters={applied}
              filtersKey={appliedKey}
              header={(total) => (
                <div className="flex items-center gap-2 px-4 md:px-0">
                  <p className="text-sm font-semibold text-navy mr-auto" aria-live="polite">
                    {total === null ? 'Recherche…' : plural(total, 'résultat')}
                  </p>
                  <label className="sr-only" htmlFor="search-sort">Trier par</label>
                  <SelectInput
                    id="search-sort"
                    value={applied.sort ?? 'pertinence'}
                    onChange={(e) => apply({ ...applied, sort: e.target.value as SearchSort })}
                    className="!w-auto h-9"
                  >
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </SelectInput>
                  <button
                    type="button"
                    onClick={onSaveClick}
                    className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-brand text-brand text-sm font-semibold hover:bg-brand-50"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="hidden sm:inline">Enregistrer</span>
                    <span className="sr-only sm:hidden">Enregistrer la recherche</span>
                  </button>
                </div>
              )}
            />
          )}
        </div>
      </div>

      <Modal
        open={sheetOpen}
        onOpenChange={(open) => { setSheetOpen(open); if (!open) setDraft(applied); }}
        title={panelTitle}
        footer={<div className="flex gap-2">{resetButton}{applyButton('flex-1')}</div>}
      >
        <FiltersForm idPrefix="sheet" value={draft} onChange={setDraft} options={options} />
      </Modal>

      <SaveSearchDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        defaultName={describeFilters(applied, options)}
        onSave={async (name, alertEnabled) => {
          await create({ name, alertEnabled, filters: applied });
          showToast(alertEnabled ? 'Recherche enregistrée — alerte activée' : 'Recherche enregistrée');
        }}
      />
      {toastNode}
    </ShellColumns>
  );
}
