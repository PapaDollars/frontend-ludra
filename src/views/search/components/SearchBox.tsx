'use client';

import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Briefcase, Building2, MapPin, Search, Wrench, X } from 'lucide-react';

import { cn } from '@/utilis/utils';
import { searchService } from '@/services/search.service';
import type { SearchSuggestion, SuggestionKind } from '@/types';

const ICONS: Record<SuggestionKind, typeof MapPin> = {
  city: Building2,
  district: MapPin,
  job: Briefcase,
  category: Wrench,
};

interface SearchBoxProps {
  /** Texte appliqué (venant de l'URL). */
  value: string;
  onSubmit: (q: string) => void;
  onPickSuggestion: (s: SearchSuggestion) => void;
}

/** Recherche unique : texte libre + suggestions villes, quartiers, métiers, services. */
export function SearchBox({ value, onSubmit, onPickSuggestion }: SearchBoxProps) {
  const [text, setText] = useState(value);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const listId = useId();
  const wrapper = useRef<HTMLFormElement>(null);

  useEffect(() => setText(value), [value]);

  // Suggestions avec anti-rebond
  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    const t = setTimeout(() => {
      searchService.suggestions(q)
        .then((s) => { if (!cancelled) { setSuggestions(s); setHighlight(-1); } })
        .catch(() => { if (!cancelled) setSuggestions([]); });
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [text]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const pick = (s: SearchSuggestion) => {
    setOpen(false);
    setText('');
    onPickSuggestion(s);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (open && highlight >= 0 && suggestions[highlight]) return pick(suggestions[highlight]);
    setOpen(false);
    onSubmit(text.trim());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHighlight((h) => (h + 1) % suggestions.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1)); }
    if (e.key === 'Escape') setOpen(false);
  };

  const showList = open && suggestions.length > 0;

  return (
    <form ref={wrapper} onSubmit={submit} role="search" className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && highlight >= 0 ? `${listId}-${highlight}` : undefined}
        aria-label="Rechercher"
        value={text}
        onChange={(e) => { setText(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Ville, quartier, bien, métier, service…"
        className="w-full h-11 rounded-full border border-slate-200 bg-white pl-10 pr-10 text-sm text-navy outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
      />
      {text && (
        <button
          type="button"
          aria-label="Effacer la recherche"
          onClick={() => { setText(''); if (value) onSubmit(''); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {showList && (
        <ul id={listId} role="listbox" className="absolute z-30 left-0 right-0 mt-2 rounded-xl bg-white border border-slate-100 shadow-lg py-1 max-h-80 overflow-auto">
          {suggestions.map((s, i) => {
            const Icon = ICONS[s.kind];
            return (
              <li
                key={`${s.kind}-${s.label}-${s.hint}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === highlight}
                onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                onMouseEnter={() => setHighlight(i)}
                className={cn('flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm', i === highlight && 'bg-surface')}
              >
                <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-navy">{s.label}</span>
                {s.hint && <span className="ml-auto text-xs text-slate-400">{s.hint}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}
