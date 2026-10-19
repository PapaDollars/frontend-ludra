'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { useRole } from '@/hooks/useRole';
import { reviewService } from '@/services/review.service';
import type { Publisher, StarRating } from '@/types';
import { ShellColumns } from '@/components/shell/ShellColumns';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Pill } from '@/components/ui/Pill';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';
import { useReviewEligibility } from '@/components/reviews/useReviewEligibility';
import { KIND_LABEL } from '@/views/feed/components/FeedCard';
import { ReviewsBoard } from './ReviewsBoard';

/** Avis publics sur un publieur : /avis/[userId]. */
export default function SubjectReviewsPage({ userId }: { userId: string }) {
  const router = useRouter();
  const { isAuthenticated } = useRole();
  const { pending, refresh } = useReviewEligibility(userId, isAuthenticated);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchPage = useCallback(
    (cursor: string | null, rating?: StarRating) => reviewService.forUser(userId, { cursor, rating, limit: 10 }),
    [userId],
  );

  const header = (subject: Publisher) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <div className="flex items-center gap-3">
        <UserAvatar name={subject.name} src={subject.avatar} />
        <div>
          <p className="font-semibold text-navy flex items-center gap-2">{subject.name} {subject.verified && <Pill tone="trust">Vérifié</Pill>}</p>
          <p className="text-xs text-slate-500">{KIND_LABEL[subject.kind][subject.verified ? 1 : 0]}</p>
        </div>
      </div>
      {pending.length > 0 && (
        <>
          <button type="button" onClick={() => setDialogOpen(true)} className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg bg-brand text-white text-sm font-semibold">
            <Star className="w-4 h-4" /> Laisser un avis
          </button>
          <ReviewDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            subject={subject}
            interactions={pending}
            onSaved={() => { refresh(); setReloadKey((k) => k + 1); }}
          />
        </>
      )}
    </div>
  );

  return (
    <ShellColumns>
      <div className="flex flex-col gap-3 pt-3 md:pt-0">
        <div className="px-4 md:px-0 flex items-center gap-2">
          <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push(URL.v2.feed))} aria-label="Retour" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white">
            <ArrowLeft className="w-5 h-5 text-navy" />
          </button>
          <h1 className="text-xl font-bold text-navy">Avis &amp; réputation</h1>
        </div>
        <ReviewsBoard fetchPage={fetchPage} actions={header} reloadKey={reloadKey} emptyText="Aucun avis pour cette note." />
        <p className="mx-4 md:mx-0 text-[11px] text-slate-400">
          Les avis sont publiés après une interaction vérifiable (échange, contact direct ou visite). Un seul avis par interaction ; seule la modération peut en supprimer.
        </p>
      </div>
    </ShellColumns>
  );
}
