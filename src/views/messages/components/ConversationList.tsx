'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { formatShortStamp } from '@/utilis/format';
import type { Conversation } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface ConversationListProps {
  conversations: Conversation[] | null;
  error: string | null;
  selectedId?: string;
  query: string;
  onQueryChange: (q: string) => void;
  onRetry: () => void;
}

export function ConversationList({ conversations, error, selectedId, query, onQueryChange, onRetry }: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-3">
        <h1 className="text-lg font-bold text-navy mb-3">Messages</h1>
        <label className="relative block">
          <span className="sr-only">Rechercher une conversation</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher…"
            className="w-full h-9 rounded-full bg-surface pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {error && (
          <div className="p-4 text-center text-sm text-red-600">
            {error} <button type="button" onClick={onRetry} className="underline font-medium">Réessayer</button>
          </div>
        )}

        {conversations === null && !error && (
          <ul aria-hidden="true" className="animate-pulse">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 p-3">
                <span className="w-10 h-10 rounded-full bg-slate-100" />
                <span className="flex-1 space-y-2"><span className="block h-3 w-24 rounded bg-slate-100" /><span className="block h-3 w-40 rounded bg-slate-100" /></span>
              </li>
            ))}
          </ul>
        )}

        {conversations?.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">
            {query ? 'Aucune conversation trouvée.' : 'Aucune conversation pour le moment. Contactez un publieur depuis une annonce.'}
          </p>
        )}

        <ul>
          {conversations?.map((c) => {
            const active = c.id === selectedId;
            const unread = c.unreadCount > 0;
            return (
              <li key={c.id}>
                <Link
                  href={URL.v2.conversation(c.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex items-center gap-3 rounded-xl p-3 transition-colors', active ? 'bg-brand-50' : 'hover:bg-surface')}
                >
                  <span className="relative">
                    <UserAvatar name={c.participant.name} src={c.participant.avatar} />
                    {c.participantOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-trust ring-2 ring-white" aria-label="En ligne" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={cn('truncate text-sm text-navy', unread ? 'font-bold' : 'font-semibold')}>{c.participant.name}</span>
                      {c.lastMessage && <span className="ml-auto shrink-0 text-[11px] text-slate-400">{formatShortStamp(c.lastMessage.createdAt)}</span>}
                    </span>
                    {c.context && <span className="block truncate text-xs text-slate-500">{c.context.title}</span>}
                    <span className="flex items-center gap-2">
                      <span className={cn('truncate text-xs', unread ? 'text-navy font-medium' : 'text-slate-400')}>
                        {c.lastMessage ? `${c.lastMessage.fromMe ? 'Vous : ' : ''}${c.lastMessage.text}` : 'Nouvelle conversation'}
                      </span>
                      {unread && (
                        <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center" aria-label={`${c.unreadCount} non lus`}>
                          {c.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
