'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, Eye, Heart, Loader2, MessageCircle, Pause, Pencil, Play, Plus, KeyRound } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { formatPrice } from '@/utilis/format';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { accountService } from '@/services/account.service';
import type { FeedItem, MyItem, MyItemStatus, MyItemStatusChange } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { Pill, type PillTone } from '@/components/ui/Pill';
import { useToast } from '@/components/ui/Toast';
import { ChipTabs } from '@/views/feed/components/FeedTabs';
import { itemHref } from '@/views/feed/components/FeedCard';

const STATUS: Record<MyItemStatus, [string, PillTone]> = {
  active: ['En ligne', 'trust'],
  paused: ['En pause', 'neutral-soft'],
  rented: ['Loué / vendu', 'brand-soft'],
  archived: ['Archivée', 'neutral'],
  pending_review: ['En vérification', 'caution-soft'],
  pending_kyc: ['Certification requise', 'caution'],
};

type Tab = 'all' | 'active' | 'paused' | 'archived';

const subtitle = (i: FeedItem) =>
  i.universe === 'immobilier' ? formatPrice(i.price, i.priceUnit) : i.universe === 'personnel' ? `Profil ${i.job}` : i.categoryLabel;

/** Mes annonces, profil candidat et services : statut, statistiques, modification. */
export default function MyItemsPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [tab, setTab] = useState<Tab>('all');
  const [items, setItems] = useState<MyItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { show: showToast, node: toastNode } = useToast();

  const load = useCallback(() => {
    accountService.items(tab).then(setItems).catch((e) => { setItems([]); showToast(e instanceof Error ? e.message : 'Chargement impossible'); });
  }, [tab, showToast]);
  useEffect(() => { if (ready) load(); }, [ready, load]);

  const setStatus = async (m: MyItem, status: MyItemStatusChange, msg: string) => {
    setBusy(m.item.id);
    try { await accountService.setItemStatus(m.item.id, status); showToast(msg); load(); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Action impossible'); }
    finally { setBusy(null); }
  };

  const edit = async (m: MyItem) => {
    setBusy(m.item.id);
    try {
      const draft = await accountService.editDraft(m.item.id);
      router.push(`${URL.v2.publish}?draft=${draft.id}`);
    } catch (e) { showToast(e instanceof Error ? e.message : 'Modification impossible'); setBusy(null); }
  };

  const action = 'h-8 px-2.5 inline-flex items-center gap-1 rounded-lg border border-slate-200 text-xs font-semibold text-navy hover:bg-surface disabled:opacity-50';

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <header className="mx-4 md:mx-0 flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-navy">Mes annonces</h1>
          <Link href={URL.v2.publish} className="h-9 px-3 inline-flex items-center gap-1 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-600"><Plus className="w-4 h-4" /> Publier</Link>
        </header>
        <ChipTabs<Tab>
          tabs={[{ value: 'all', label: 'Toutes' }, { value: 'active', label: 'En ligne' }, { value: 'paused', label: 'En pause' }, { value: 'archived', label: 'Archivées' }]}
          value={tab} onChange={setTab} label="Filtrer mes annonces"
        />

        {items === null ? <Loader2 className="mx-auto w-6 h-6 animate-spin text-brand" /> : items.length === 0 ? (
          <p className="mx-4 md:mx-0 rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
            Aucune publication ici. <Link href={URL.v2.publish} className="font-semibold text-brand underline">Publier une offre</Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((m) => {
              const [label, tone] = STATUS[m.status];
              const thumb = m.item.media[0]?.url;
              const disabled = busy === m.item.id;
              return (
                <li key={m.item.id} className="bg-white md:rounded-2xl border-y md:border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
                  {thumb ? <img src={thumb} alt="" className="w-full sm:w-32 h-32 sm:h-24 rounded-xl object-cover" /> : <span className="hidden sm:block w-32 h-24 rounded-xl bg-surface" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={tone}>{label}</Pill>
                      <span className="text-[11px] text-slate-400">{m.item.universe === 'immobilier' ? 'Immobilier' : m.item.universe === 'personnel' ? 'Personnel' : 'Service'}</span>
                    </div>
                    <Link href={itemHref(m.item)} className="mt-1 block font-semibold text-navy hover:underline truncate">{m.item.title}</Link>
                    <p className="text-sm text-slate-500">{subtitle(m.item)} · {[m.item.district, m.item.city].filter(Boolean).join(', ')}</p>
                    <p className="mt-1 flex gap-3 text-xs text-slate-500" aria-label="Statistiques">
                      <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {m.stats.views} vues</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {m.stats.contacts} contacts</span>
                      <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {m.stats.favorites}</span>
                    </p>
                    {m.status === 'pending_kyc' && <Link href={URL.v2.certification} className="mt-1 inline-block text-xs font-semibold text-caution underline">Faire certifier mon compte</Link>}
                  </div>
                  <div className="flex flex-wrap sm:flex-col gap-1.5 sm:items-end">
                    <button type="button" disabled={disabled} onClick={() => edit(m)} className={action}><Pencil className="w-3.5 h-3.5" /> Modifier</button>
                    {m.status === 'active' && (
                      <>
                        <button type="button" disabled={disabled} onClick={() => setStatus(m, 'paused', 'Annonce mise en pause')} className={action}><Pause className="w-3.5 h-3.5" /> Pause</button>
                        {m.item.universe === 'immobilier' && <button type="button" disabled={disabled} onClick={() => setStatus(m, 'rented', 'Marquée louée / vendue')} className={action}><KeyRound className="w-3.5 h-3.5" /> Loué / vendu</button>}
                        <button type="button" disabled={disabled} onClick={() => setStatus(m, 'archived', 'Annonce archivée')} className={action}><Archive className="w-3.5 h-3.5" /> Archiver</button>
                      </>
                    )}
                    {['paused', 'rented', 'archived'].includes(m.status) && (
                      <button type="button" disabled={disabled} onClick={() => setStatus(m, 'active', 'Annonce remise en ligne')} className={`${action} !border-trust !text-trust`}><Play className="w-3.5 h-3.5" /> Remettre en ligne</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mx-4 md:mx-0 text-[11px] text-slate-400">Une annonce en pause, louée ou archivée n&apos;apparaît plus dans le feed ni dans la recherche.</p>
      </div>
      {toastNode}
    </ShellColumns>
  );
}
