import { AlertCircle, Check, CheckCheck, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '@/utilis/utils';
import { formatClock } from '@/utilis/format';
import type { MessageModeration } from '@/types';
import type { UiMessage } from '../useConversation';

const MODERATION_NOTE: Record<MessageModeration, string> = {
  contact_masked: 'Coordonnées masquées : utilisez le contact direct sécurisé.',
  link_blocked: 'Lien retiré par sécurité.',
  image_rejected: 'Image refusée par le contrôle.',
};

interface MessageBubbleProps {
  message: UiMessage;
  read: boolean;
  onRetry: (m: UiMessage) => void;
}

export function MessageBubble({ message: m, read, onRetry }: MessageBubbleProps) {
  if (m.kind === 'system') {
    return (
      <p className="mx-auto max-w-sm rounded-lg bg-caution-50 px-3 py-2 text-center text-xs text-amber-900">{m.text}</p>
    );
  }

  const mine = m.fromMe;
  return (
    <div className={cn('flex flex-col max-w-[80%] md:max-w-[65%]', mine ? 'self-end items-end' : 'self-start items-start')}>
      <div
        className={cn(
          'rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words',
          mine ? 'bg-brand-50 text-navy rounded-br-md' : 'bg-white border border-slate-200 text-navy rounded-bl-md',
          m.local === 'failed' && 'opacity-60',
        )}
      >
        {m.image && (
          <img src={m.image.url} alt="Image envoyée" className="mb-1 max-h-64 rounded-lg object-cover" />
        )}
        {m.text}
      </div>

      {m.moderation?.map((flag) => (
        <p key={flag} className="mt-1 inline-flex items-center gap-1 text-[11px] text-caution">
          <ShieldAlert className="w-3 h-3" /> {MODERATION_NOTE[flag]}
        </p>
      ))}

      <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-slate-400">
        {formatClock(m.createdAt)}
        {mine && m.local === 'sending' && <Clock className="w-3 h-3" aria-label="Envoi en cours" />}
        {mine && !m.local && (read
          ? <CheckCheck className="w-3.5 h-3.5 text-brand" aria-label="Lu" />
          : <Check className="w-3.5 h-3.5" aria-label="Envoyé" />)}
      </span>
      {m.local === 'failed' && (
        <button type="button" onClick={() => onRetry(m)} className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-red-600 font-medium">
          <AlertCircle className="w-3 h-3" /> Non envoyé · Réessayer
        </button>
      )}
    </div>
  );
}
