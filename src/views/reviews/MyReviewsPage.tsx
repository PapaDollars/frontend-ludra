'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Star } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { formatShortStamp } from '@/utilis/format';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { reviewService } from '@/services/review.service';
import type { ReviewableInteraction, StarRating } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';
import { useToast } from '@/components/ui/Toast';
import { ChipTabs } from '@/views/feed/components/FeedTabs';
import { ReviewsBoard } from './ReviewsBoard';

type Tab = 'a_donner' | 'recus';
const KIND = { conversation: 'Échange', contact_unlock: 'Contact direct', visit: 'Visite' } as const;

/** Mon compte › Avis : avis à donner + avis reçus (avec réponse publique). */
export default function MyReviewsPage() {
  const { ready } = useRequireAuth();
  const [tab, setTab] = useState<Tab>('a_donner');
  const [interactions, setInteractions] = useState<ReviewableInteraction[] | null>(null);
  const [rating, setRating] = useState<ReviewableInteraction | null>(null);
  const { show: showToast, node: toastNode } = useToast();

  const refresh = useCallback(() => {
    reviewService.eligibility().then(setInteractions).catch(() => setInteractions([]));
  }, []);
  useEffect(() => { if (ready) refresh(); }, [ready, refresh]);

  const fetchReceived = useCallback(
    (cursor: string | null, r?: StarRating) => reviewService.received({ cursor, rating: r, limit: 10 }),
    [],
  );

  if (!ready) return <ShellColumns><div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div></ShellColumns>;

  const pending = interactions?.filter((i) => !i.reviewId) ?? [];

  return (
    <ShellColumns>
      <div className="flex flex-col gap-4 pt-3 md:pt-0">
        <h1 className="px-4 md:px-0 text-xl font-bold text-navy">Mes avis</h1>
        <ChipTabs
          tabs={[{ value: 'a_donner', label: `À donner${pending.length ? ` (${pending.length})` : ''}` }, { value: 'recus', label: 'Reçus' }]}
          value={tab}
          onChange={setTab}
          label="Mes avis"
        />

        {tab === 'a_donner' && (
          <div className="mx-4 md:mx-0 flex flex-col gap-2">
            {interactions === null && <Loader2 className="mx-auto w-5 h-5 animate-spin text-brand" />}
            {interactions && pending.length === 0 && (
              <p className="rounded-xl bg-white border border-slate-200 p-6 text-center text-sm text-slate-500">
                Aucun avis en attente. Vous pourrez noter un publieur après un échange, un contact direct ou une visite.
              </p>
            )}
            {pending.map((i) => (
              <div key={i.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <UserAvatar name={i.subject.name} src={i.subject.avatar} />
                <div className="min-w-0 flex-1">
                  <Link href={URL.v2.reviews(i.subject.id)} className="text-sm font-semibold text-navy hover:underline">{i.subject.name}</Link>
                  <p className="truncate text-xs text-slate-500">{KIND[i.kind]} · {i.context?.title ?? 'Sans annonce'} · {formatShortStamp(i.at)}</p>
                </div>
                <button type="button" onClick={() => setRating(i)} className="h-9 px-3 inline-flex items-center gap-1 rounded-lg bg-brand text-white text-xs font-semibold">
                  <Star className="w-3.5 h-3.5" /> Évaluer
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'recus' && <ReviewsBoard fetchPage={fetchReceived} emptyText="Vous n'avez pas encore reçu d'avis." />}
      </div>

      {rating && (
        <ReviewDialog
          open={!!rating}
          onOpenChange={(o) => { if (!o) setRating(null); }}
          subject={rating.subject}
          interactions={[rating]}
          onSaved={() => { showToast('Merci pour votre avis !'); refresh(); }}
        />
      )}
      {toastNode}
    </ShellColumns>
  );
}
