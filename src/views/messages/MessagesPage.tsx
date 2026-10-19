'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { messagingService } from '@/services/messaging.service';
import { useConversations } from './useConversations';
import { ConversationList } from './components/ConversationList';
import { ConversationView } from './components/ConversationView';

/**
 * Module 05 — Messagerie interne.
 * Desktop : liste + conversation côte à côte. Mobile : liste OU conversation plein écran.
 */
export default function MessagesPage({ conversationId }: { conversationId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready } = useRequireAuth();
  const [query, setQuery] = useState('');
  const { conversations, error, refresh, patch } = useConversations(ready, query);
  const [openError, setOpenError] = useState<string | null>(null);

  // Arrivée depuis "Message" sur une annonce : /messages?to=<publisherId>&item=<itemId>
  const to = searchParams.get('to');
  const item = searchParams.get('item') ?? undefined;
  useEffect(() => {
    if (!ready || !to) return;
    let cancelled = false;
    messagingService.open({ recipientId: to, itemId: item })
      .then((c) => { if (!cancelled) router.replace(URL.v2.conversation(c.id)); })
      .catch((e) => { if (!cancelled) setOpenError(e instanceof Error ? e.message : "Impossible d'ouvrir la conversation."); });
    return () => { cancelled = true; };
  }, [ready, to, item, router]);

  if (!ready || (to && !openError)) {
    return <div className="flex h-[60vh] items-center justify-center text-sm text-slate-400">Chargement…</div>;
  }

  return (
    <div className="mx-auto max-w-[1100px] md:px-4 md:pt-6">
      {openError && <p role="alert" className="mx-4 md:mx-0 mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{openError}</p>}
      <div
        className={cn(
          'flex bg-white md:rounded-2xl md:border md:border-slate-200 overflow-hidden',
          // Hauteur = écran − header − nav basse (mobile) / − header − marges (desktop)
          'h-[calc(100dvh-56px-80px)] md:h-[calc(100dvh-64px-56px)]',
        )}
      >
        <aside className={cn('w-full md:w-[320px] md:shrink-0 md:border-r md:border-slate-100', conversationId ? 'hidden md:block' : 'block')}>
          <ConversationList
            conversations={conversations}
            error={error}
            selectedId={conversationId}
            query={query}
            onQueryChange={setQuery}
            onRetry={refresh}
          />
        </aside>
        <section className={cn('flex-1 min-w-0 flex-col', conversationId ? 'flex' : 'hidden md:flex')} aria-label="Conversation">
          {conversationId ? (
            <ConversationView key={conversationId} id={conversationId} onActivity={patch} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-8 bg-surface">
              <MessageCircle className="w-10 h-10 text-brand-200" />
              <p className="font-semibold text-navy">Sélectionnez une conversation</p>
              <p className="text-sm text-slate-500 max-w-xs">Échangez gratuitement avec les publieurs. Aucune coordonnée n&apos;est partagée automatiquement.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
