'use client';

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ArrowLeft, Ban, ExternalLink, Flag, MoreVertical, ShieldAlert, Star } from 'lucide-react';

import URL from '@/utilis/url/url_front';
import { formatDayLabel, formatPrice, isSameDay } from '@/utilis/format';
import type { Conversation, ConversationContext } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ReportDialog } from '@/components/report/ReportDialog';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';
import { useReviewEligibility } from '@/components/reviews/useReviewEligibility';
import { useConversation } from '../useConversation';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';

const contextHref = (c: ConversationContext) =>
  c.universe === 'immobilier' ? URL.v2.listing(c.itemId)
    : c.universe === 'personnel' ? URL.v2.candidate(c.itemId)
      : URL.v2.serviceProvider(c.itemId);

interface ConversationViewProps {
  id: string;
  onActivity: (id: string, patch: Partial<Conversation>) => void;
}

/** Conversation contextualisée par annonce / profil (M05). */
export function ConversationView({ id, onActivity }: ConversationViewProps) {
  const conv = useConversation(id, (p) => onActivity(id, p));
  const { conversation: c, messages } = conv;
  const { show: showToast, node: toastNode } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const review = useReviewEligibility(c?.participant.id, !!c && messages.length > 0);
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const prevFirstId = useRef<string | undefined>(undefined);

  // Reste collé en bas sauf si l'utilisateur remonte l'historique ;
  // conserve la position quand on charge des messages plus anciens.
  const prevHeight = useRef(0);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const firstId = messages[0]?.id;
    if (prevFirstId.current && firstId !== prevFirstId.current) {
      el.scrollTop += el.scrollHeight - prevHeight.current;
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
    prevFirstId.current = firstId;
    prevHeight.current = el.scrollHeight;
  }, [messages]);

  useEffect(() => { stickToBottom.current = true; prevFirstId.current = undefined; }, [id]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  if (conv.loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Chargement…</div>;
  }
  if (conv.notFound || !c) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-semibold text-navy">{conv.notFound ? 'Conversation introuvable' : 'Erreur de chargement'}</p>
        <p className="text-sm text-slate-500">{conv.error ?? "Elle a peut-être été supprimée selon la politique de rétention."}</p>
        <Link href={URL.v2.messages} className="text-sm font-semibold text-brand underline">Retour aux messages</Link>
      </div>
    );
  }

  const onConfirmBlock = async () => {
    try {
      await conv.setBlocked(!c.blockedByMe);
      showToast(c.blockedByMe ? `${c.participant.name} est débloqué(e)` : `${c.participant.name} est bloqué(e)`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Action impossible');
    }
    setBlockOpen(false);
  };

  const lastReadAt = c.participantLastReadAt;
  const menuItem = 'flex items-center gap-2 px-3 py-2 text-sm rounded-md outline-none cursor-pointer data-[highlighted]:bg-surface';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* En-tête */}
      <header className="flex items-center gap-3 border-b border-slate-100 px-3 md:px-4 py-3 bg-white">
        <Link href={URL.v2.messages} aria-label="Retour aux conversations" className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface">
          <ArrowLeft className="w-5 h-5 text-navy" />
        </Link>
        <UserAvatar name={c.participant.name} src={c.participant.avatar} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy">
            {c.participant.name}{c.context && <span className="font-normal text-slate-500"> · {c.context.title}</span>}
          </p>
          {c.participant.verified && <p className="text-[11px] text-trust">Identité vérifiée</p>}
        </div>
        {c.participantOnline && <Pill tone="trust" className="hidden sm:inline-flex">En ligne</Pill>}

        <DropdownMenu.Root>
          <DropdownMenu.Trigger aria-label="Options de la conversation" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface text-slate-600">
            <MoreVertical className="w-5 h-5" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-[200px] rounded-xl bg-white p-1 shadow-lg border border-slate-100">
              {c.context && (
                <DropdownMenu.Item asChild className={menuItem}>
                  <Link href={contextHref(c.context)}><ExternalLink className="w-4 h-4" /> Voir l&apos;annonce</Link>
                </DropdownMenu.Item>
              )}
              {review.pending.length > 0 && (
                <DropdownMenu.Item onSelect={() => setReviewOpen(true)} className={menuItem}>
                  <Star className="w-4 h-4" /> Laisser un avis
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item onSelect={() => setReportOpen(true)} className={menuItem}>
                <Flag className="w-4 h-4" /> Signaler
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => setBlockOpen(true)} className={`${menuItem} text-red-600`}>
                <Ban className="w-4 h-4" /> {c.blockedByMe ? 'Débloquer' : 'Bloquer'}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </header>

      {/* Objet de la conversation */}
      {c.context && (
        <Link href={contextHref(c.context)} className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-2 hover:bg-surface">
          {c.context.thumbnail
            ? <img src={c.context.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
            : <span className="w-10 h-10 rounded-lg bg-brand-50" />}
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold text-navy">{c.context.title}</span>
            {c.context.price !== undefined && <span className="block text-xs font-semibold text-brand">{formatPrice(c.context.price, c.context.priceUnit)}</span>}
          </span>
        </Link>
      )}

      {/* Fil */}
      <div ref={scroller} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto bg-surface px-3 md:px-6 py-4">
        <div className="flex flex-col gap-2" aria-live="polite">
          {conv.hasOlder && (
            <button type="button" onClick={conv.loadOlder} disabled={conv.loadingOlder} className="self-center mb-2 text-xs font-medium text-brand hover:underline">
              {conv.loadingOlder ? 'Chargement…' : 'Afficher les messages précédents'}
            </button>
          )}
          <p className="self-center mb-2 flex items-center gap-1.5 rounded-lg bg-caution-50 px-3 py-2 text-center text-xs text-amber-900">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> Ne partagez jamais un code Mobile Money dans le chat.
          </p>
          {messages.map((m, i) => (
            <Fragment key={m.id}>
              {(i === 0 || !isSameDay(messages[i - 1].createdAt, m.createdAt)) && (
                <p className="self-center my-2 text-[11px] font-medium text-slate-400">{formatDayLabel(m.createdAt)}</p>
              )}
              <MessageBubble message={m} read={!!lastReadAt && m.createdAt <= lastReadAt} onRetry={conv.retry} />
            </Fragment>
          ))}
          {messages.length === 0 && (
            <p className="self-center mt-6 text-sm text-slate-500 text-center">
              Présentez-vous et posez vos questions. La messagerie est gratuite.
            </p>
          )}
        </div>
      </div>

      {/* Saisie ou blocage */}
      {c.blockedByMe ? (
        <div className="border-t border-slate-100 bg-white p-4 text-center text-sm text-slate-600">
          Vous avez bloqué {c.participant.name} ·{' '}
          <button type="button" onClick={() => setBlockOpen(true)} className="font-semibold text-brand underline">Débloquer</button>
        </div>
      ) : c.blockedMe ? (
        <div className="border-t border-slate-100 bg-white p-4 text-center text-sm text-slate-500">
          Vous ne pouvez plus répondre à cette conversation.
        </div>
      ) : (
        <Composer onSend={conv.send} />
      )}

      <Modal
        open={blockOpen}
        onOpenChange={setBlockOpen}
        title={c.blockedByMe ? `Débloquer ${c.participant.name} ?` : `Bloquer ${c.participant.name} ?`}
        description={c.blockedByMe
          ? 'Vous pourrez de nouveau échanger dans cette conversation.'
          : 'Cette personne ne pourra plus vous écrire. Vous pouvez la débloquer à tout moment.'}
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setBlockOpen(false)} className="flex-1 h-11 rounded-lg border border-slate-200 text-sm font-semibold text-navy">Annuler</button>
            <button type="button" onClick={onConfirmBlock} className={`flex-1 h-11 rounded-lg text-sm font-semibold text-white ${c.blockedByMe ? 'bg-brand' : 'bg-red-600'}`}>
              {c.blockedByMe ? 'Débloquer' : 'Bloquer'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          {c.blockedByMe ? '' : 'Si cette personne vous a demandé un paiement suspect, signalez-la aussi.'}
        </p>
      </Modal>
      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        subject={c.participant}
        interactions={review.pending}
        onSaved={() => { review.refresh(); showToast('Merci pour votre avis !'); }}
      />
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="user"
        targetId={c.participant.id}
        onDone={() => showToast('Merci, votre signalement a été transmis')}
      />
      {toastNode}
    </div>
  );
}
