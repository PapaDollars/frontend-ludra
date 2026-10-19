'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderPlus, Loader2, Pencil, Trash2 } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { savedService } from '@/services/saved.service';
import type { FeedFilter, FeedItem, SavedCollection, SavedItem } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { Modal } from '@/components/ui/Modal';
import { Field, SelectInput, TextInput } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { FeedTabs } from '@/views/feed/components/FeedTabs';
import { FeedCard, itemHref } from '@/views/feed/components/FeedCard';

/** `undefined` = tous les favoris ; `null` = sans collection. */
type CollectionFilter = string | null | undefined;

/** Favoris (M15) : biens, profils et services sauvegardés, collections optionnelles. */
export default function FavoritesPage() {
  const { ready } = useRequireAuth();
  const [universe, setUniverse] = useState<FeedFilter>('tous');
  const [collection, setCollection] = useState<CollectionFilter>(undefined);
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [dialog, setDialog] = useState<'create' | 'rename' | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { show: showToast, node: toastNode } = useToast();

  const loadCollections = useCallback(() => savedService.collections().then(setCollections).catch(() => undefined), []);
  const load = useCallback(() => {
    savedService.list({ universe: universe === 'tous' ? undefined : universe, collectionId: collection, limit: 50 })
      .then((p) => setItems(p.items)).catch(() => setItems([]));
  }, [universe, collection]);

  useEffect(() => { if (ready) { load(); loadCollections(); } }, [ready, load, loadCollections]);

  const unsave = async (item: FeedItem) => {
    setItems((prev) => prev?.filter((s) => s.item.id !== item.id) ?? null);
    try { await savedService.toggle(item.id, item.universe, true); showToast('Retiré des favoris'); loadCollections(); }
    catch { showToast('Action impossible'); load(); }
  };

  const share = async (item: FeedItem) => {
    const url = `${window.location.origin}${itemHref(item)}`;
    try { if (navigator.share) await navigator.share({ title: item.title, url }); else { await navigator.clipboard.writeText(url); showToast('Lien copié'); } } catch { /* annulé */ }
  };

  const move = async (s: SavedItem, collectionId: string | null) => {
    try {
      await savedService.move(s.item.id, collectionId);
      showToast(collectionId ? 'Rangé dans la collection' : 'Retiré de la collection');
      load(); loadCollections();
    } catch (e) { showToast(e instanceof Error ? e.message : 'Action impossible'); }
  };

  const current = collections.find((c) => c.id === collection);

  const submitCollection = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2) return setError('Nom trop court.');
    try {
      if (dialog === 'rename' && current) await savedService.renameCollection(current.id, n);
      else { const c = await savedService.createCollection(n); setCollection(c.id); }
      setDialog(null);
      loadCollections();
    } catch (err) { setError(err instanceof Error ? err.message : 'Action impossible'); }
  };

  const removeCollection = async () => {
    if (!current) return;
    await savedService.deleteCollection(current.id);
    setCollection(undefined);
    loadCollections();
    showToast('Collection supprimée, ses favoris sont conservés');
  };

  const chip = (active: boolean) => cn('shrink-0 h-8 px-3 rounded-full text-xs font-medium border', active ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-200');

  return (
    <ShellColumns>
      <div className="flex flex-col gap-3 md:gap-4 pt-3 md:pt-0">
        <h1 className="px-4 md:px-0 text-xl font-bold text-navy">Favoris</h1>
        <FeedTabs value={universe} onChange={setUniverse} />

        <div className="flex items-center gap-2 overflow-x-auto px-4 md:px-0 no-scrollbar" role="group" aria-label="Collections">
          <button type="button" aria-pressed={collection === undefined} onClick={() => setCollection(undefined)} className={chip(collection === undefined)}>Tous les favoris</button>
          <button type="button" aria-pressed={collection === null} onClick={() => setCollection(null)} className={chip(collection === null)}>Sans collection</button>
          {collections.map((c) => (
            <button key={c.id} type="button" aria-pressed={collection === c.id} onClick={() => setCollection(c.id)} className={chip(collection === c.id)}>{c.name} ({c.count})</button>
          ))}
          <button type="button" onClick={() => { setName(''); setError(null); setDialog('create'); }} className="shrink-0 h-8 px-3 inline-flex items-center gap-1 rounded-full border border-dashed border-brand text-brand text-xs font-semibold">
            <FolderPlus className="w-3.5 h-3.5" /> Nouvelle collection
          </button>
        </div>
        {current && (
          <div className="flex gap-2 px-4 md:px-0">
            <button type="button" onClick={() => { setName(current.name); setError(null); setDialog('rename'); }} className="h-8 px-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-navy"><Pencil className="w-3.5 h-3.5" /> Renommer</button>
            <button type="button" onClick={removeCollection} className="h-8 px-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-red-600"><Trash2 className="w-3.5 h-3.5" /> Supprimer la collection</button>
          </div>
        )}

        {items === null ? <Loader2 className="mx-auto w-6 h-6 animate-spin text-brand" /> : items.length === 0 ? (
          <p className="mx-4 md:mx-0 rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
            Aucun favori ici. Appuyez sur « Enregistrer » dans le feed pour retrouver une offre. <Link href={URL.v2.feed} className="font-semibold text-brand underline">Explorer</Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-3 md:gap-4">
            {items.map((s) => (
              <li key={s.item.id} className="flex flex-col">
                <FeedCard item={s.item} onToggleSave={unsave} onShare={share} />
                <div className="flex items-center gap-2 bg-white md:rounded-b-2xl border-x-0 md:border-x border-b border-slate-200 -mt-px md:-mt-3 md:pt-3 px-4 pb-3">
                  <label htmlFor={`col-${s.item.id}`} className="text-xs text-slate-500">Collection</label>
                  <SelectInput id={`col-${s.item.id}`} value={s.collectionId ?? ''} onChange={(e) => move(s, e.target.value || null)} className="!w-auto h-8 text-xs">
                    <option value="">Aucune</option>
                    {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </SelectInput>
                  <span className="ml-auto text-[11px] text-slate-400">Enregistré le {new Date(s.savedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={dialog !== null}
        onOpenChange={(o) => { if (!o) setDialog(null); }}
        title={dialog === 'rename' ? 'Renommer la collection' : 'Nouvelle collection'}
        footer={<button form="collection-form" type="submit" className="w-full h-11 rounded-lg bg-brand text-white text-sm font-semibold">{dialog === 'rename' ? 'Renommer' : 'Créer'}</button>}
      >
        <form id="collection-form" onSubmit={submitCollection}>
          <Field label="Nom" htmlFor="collection-name" error={error ?? undefined} hint="Ex. Studios Yaoundé, Chauffeurs à rappeler">
            <TextInput id="collection-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
        </form>
      </Modal>
      {toastNode}
    </ShellColumns>
  );
}
