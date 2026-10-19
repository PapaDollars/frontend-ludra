'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Flag, Search } from 'lucide-react';

import { formatShortStamp } from '@/utilis/format';
import { adminService } from '@/services/admin.service';
import type { AdminListing, AdminListingStatus, ListingDecision } from '@/types';
import { Pill, type PillTone } from '@/components/ui/Pill';
import { useToast } from '@/components/ui/Toast';
import { itemHref } from '@/views/feed/components/FeedCard';
import { AdminCard, AdminGate, AdminHeader, DecisionDialog, EmptyRow, TabBar, useAdminGuard, type DecisionOption } from '@/components/admin/AdminParts';

type Tab = 'moderer' | 'signalees' | 'active' | 'suspended' | 'all';

const STATUS: Record<AdminListingStatus, [string, PillTone]> = {
  active: ['En ligne', 'trust'], pending_review: ['À vérifier', 'caution'], pending_kyc: ['Attente KYC', 'caution-soft'],
  paused: ['En pause', 'neutral-soft'], rented: ['Loué', 'brand-soft'], archived: ['Archivée', 'neutral-soft'],
  suspended: ['Suspendue', 'danger'], rejected: ['Rejetée', 'danger-soft'],
};

const OPTIONS: Record<string, DecisionOption<ListingDecision>[]> = {
  pending: [{ value: 'approve', label: 'Approuver et publier' }, { value: 'reject', label: 'Rejeter', negative: true }],
  active: [{ value: 'suspend', label: 'Suspendre (masquer du public)', negative: true }],
  blocked: [{ value: 'restore', label: 'Rétablir' }],
};

/** Modération des annonces : nouvelles, signalées, suspendues ; mise en avant « Sponsorisé ». */
export default function AdminListingsPage() {
  const guard = useAdminGuard(['manage_properties']);
  const [tab, setTab] = useState<Tab>('moderer');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AdminListing[] | null>(null);
  const [target, setTarget] = useState<AdminListing | null>(null);
  const { show: showToast, node: toastNode } = useToast();

  const load = useCallback(async () => {
    const status = tab === 'active' ? 'active' : tab === 'suspended' ? 'suspended' : undefined;
    const page = await adminService.listings({ status, q: q || undefined });
    let items = page.items;
    if (tab === 'moderer') items = items.filter((l) => l.status === 'pending_review' || l.status === 'pending_kyc');
    if (tab === 'signalees') items = items.filter((l) => l.reportsCount > 0);
    setRows(items);
  }, [tab, q]);

  useEffect(() => { if (guard.allowed) { const t = setTimeout(load, 200); return () => clearTimeout(t); } }, [guard.allowed, load]);

  const decide = async (l: AdminListing, d: ListingDecision, reason?: string) => {
    await adminService.listingDecision(guard.actor, l.item.id, d, reason);
    showToast('Décision enregistrée et journalisée');
    load();
  };

  const optionsFor = (l: AdminListing) =>
    l.status.startsWith('pending') ? OPTIONS.pending : ['suspended', 'rejected'].includes(l.status) ? OPTIONS.blocked : OPTIONS.active;

  return (
    <AdminGate guard={guard}>
      <AdminHeader title="Annonces" subtitle="Validation, suspension et mise en avant. Toute décision est journalisée." />
      <TabBar<Tab> label="Filtrer les annonces" value={tab} onChange={setTab}
        tabs={[{ value: 'moderer', label: 'À modérer' }, { value: 'signalees', label: 'Signalées' }, { value: 'active', label: 'En ligne' }, { value: 'suspended', label: 'Suspendues' }, { value: 'all', label: 'Toutes' }]} />
      <label className="relative mb-4 block max-w-sm">
        <span className="sr-only">Rechercher</span>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titre, publieur, ville…" className="w-full h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand" />
      </label>

      <AdminCard>
        {rows === null ? <EmptyRow>Chargement…</EmptyRow> : rows.length === 0 ? <EmptyRow>Aucune annonce dans cette file.</EmptyRow> : (
          <ul className="divide-y divide-slate-100">
            {rows.map((l) => {
              const [label, tone] = STATUS[l.status];
              return (
                <li key={l.item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
                  {l.item.media[0] ? <img src={l.item.media[0].url} alt="" className="w-full sm:w-24 h-28 sm:h-16 rounded-lg object-cover" /> : <span className="hidden sm:block w-24 h-16 rounded-lg bg-surface" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={tone}>{label}</Pill>
                      {l.reportsCount > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><Flag className="w-3.5 h-3.5" /> {l.reportsCount}</span>}
                      {l.item.sponsored && <Pill tone="neutral-soft">Sponsorisé</Pill>}
                    </div>
                    <Link href={itemHref(l.item)} target="_blank" className="block truncate font-medium text-navy hover:underline">{l.item.title}</Link>
                    <p className="text-xs text-slate-500">{l.item.publisher.name} · {l.publisherEmail} · {l.item.city} · {formatShortStamp(l.updatedAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setTarget(l)} className="h-8 px-3 rounded-lg bg-brand text-white text-xs font-semibold">Décider</button>
                    {l.status === 'active' && (
                      <button type="button" onClick={() => decide(l, l.item.sponsored ? 'unsponsor' : 'sponsor')} className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-navy">
                        {l.item.sponsored ? 'Retirer la mise en avant' : 'Mettre en avant'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      {target && (
        <DecisionDialog
          open={!!target}
          onOpenChange={(o) => { if (!o) setTarget(null); }}
          title={target.item.title}
          description={`${target.item.publisher.name} — statut actuel : ${STATUS[target.status][0]}`}
          options={optionsFor(target)}
          onConfirm={(d, r) => decide(target, d, r)}
        />
      )}
      {toastNode}
    </AdminGate>
  );
}
