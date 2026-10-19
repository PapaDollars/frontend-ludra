// mocks/messages.mock.ts — Messagerie (démo, remplacée par /conversations…)
//
// Simulation : chaque message envoyé reçoit une réponse automatique ~4 s plus tard,
// pour tester le rafraîchissement et les badges non lus.
import { ApiError } from '@/lib/api';
import { maskContactInfo } from '@/lib/messageSafety';
import type {
  Conversation, ConversationContext, CursorPage, FeedItem, Message, MessageModeration, OpenConversationInput, Publisher,
} from '@/types';
import { FEED_ITEMS } from './feed.mock';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const AUTO_REPLY_MS = 4000;

const contextOf = (item: FeedItem): ConversationContext => ({
  universe: item.universe,
  itemId: item.id,
  title: item.title,
  thumbnail: item.media[0]?.url ?? null,
  ...(item.universe === 'immobilier' ? { price: item.price, priceUnit: item.priceUnit } : {}),
});

const item = (id: string) => FEED_ITEMS.find((i) => i.id === id)!;

interface ConvState { conv: Conversation; messages: Message[] }

let seq = 100;
const nextId = (p: string) => `${p}-${++seq}`;

const msg = (conversationId: string, fromMe: boolean, text: string, at: string): Message => ({
  id: nextId('m'), conversationId, kind: 'text', fromMe, text, createdAt: at,
});

function seed(): Map<string, ConvState> {
  const store = new Map<string, ConvState>();
  const add = (id: string, participant: Publisher, ctx: ConversationContext | null, messages: Message[], unread: number, online: boolean) => {
    const last = messages[messages.length - 1];
    store.set(id, {
      conv: {
        id, participant, context: ctx, unreadCount: unread, participantOnline: online, blockedByMe: false, blockedMe: false,
        participantLastReadAt: last.fromMe ? null : last.createdAt,
        updatedAt: last.createdAt,
        lastMessage: { text: last.text ?? 'Photo', fromMe: last.fromMe, createdAt: last.createdAt },
      },
      messages,
    });
  };
  const l1 = item('l-001');
  add('cv-1', l1.publisher, contextOf(l1), [
    msg('cv-1', true, 'Bonjour, le logement est-il toujours disponible pour une visite ?', minutesAgo(50)),
    msg('cv-1', false, 'Bonjour. Oui, je peux vous proposer samedi à 10h. Utilisez la messagerie ici pour confirmer.', minutesAgo(20)),
  ], 1, true);
  const l2 = item('l-002');
  add('cv-2', { id: 'u-jm', name: 'Jean M.', kind: 'agent', verified: true }, { ...contextOf(l2), title: 'Studio Mvan' }, [
    msg('cv-2', false, 'Le studio est libre dès le 1er novembre.', minutesAgo(300)),
  ], 2, false);
  const c1 = item('c-001');
  add('cv-3', { id: 'u-ck', name: 'Clarisse K.', kind: 'candidate', verified: true }, { ...contextOf(c1), title: 'Cuisinière' }, [
    msg('cv-3', true, 'Êtes-vous disponible pour un essai lundi ?', minutesAgo(1500)),
    msg('cv-3', false, 'Oui, avec plaisir.', minutesAgo(1440)),
  ], 0, false);
  return store;
}

const store = seed();

function get(id: string): ConvState {
  const s = store.get(id);
  if (!s) throw new ApiError('Conversation introuvable', 404, 'NOT_FOUND');
  return s;
}

const touch = (s: ConvState, m: Message) => {
  s.conv.updatedAt = m.createdAt;
  s.conv.lastMessage = { text: m.kind === 'image' ? (m.text || 'Photo') : (m.text ?? ''), fromMe: m.fromMe, createdAt: m.createdAt };
};

export function mockListConversations(q?: string): CursorPage<Conversation> {
  const needle = q?.toLowerCase().trim();
  const items = [...store.values()]
    .map((s) => s.conv)
    .filter((c) => c.lastMessage) // conversations vides non listées
    .filter((c) => !needle || c.participant.name.toLowerCase().includes(needle) || c.context?.title.toLowerCase().includes(needle))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { items: items.map((c) => ({ ...c })), nextCursor: null, total: items.length };
}

export function mockGetConversation(id: string): Conversation {
  return { ...get(id).conv };
}

export function mockOpenConversation({ recipientId, itemId }: OpenConversationInput): Conversation {
  for (const s of store.values()) {
    if (s.conv.participant.id === recipientId && (s.conv.context?.itemId ?? undefined) === itemId) return { ...s.conv };
  }
  const it = itemId ? FEED_ITEMS.find((i) => i.id === itemId) : undefined;
  const participant = it?.publisher ?? FEED_ITEMS.find((i) => i.publisher.id === recipientId)?.publisher;
  if (!participant) throw new ApiError('Destinataire introuvable', 404, 'NOT_FOUND');
  const id = nextId('cv');
  const conv: Conversation = {
    id, participant, context: it ? contextOf(it) : null, lastMessage: null, unreadCount: 0,
    updatedAt: new Date().toISOString(), participantOnline: true, blockedByMe: false, blockedMe: false,
    participantLastReadAt: null,
  };
  store.set(id, { conv, messages: [] });
  return { ...conv };
}

export function mockListMessages(id: string, opts: { before?: string; after?: string; limit?: number }): CursorPage<Message> {
  const { messages } = get(id);
  if (opts.after) {
    const idx = messages.findIndex((m) => m.id === opts.after);
    return { items: messages.slice(idx + 1), nextCursor: null };
  }
  const limit = opts.limit ?? 30;
  const end = opts.before ? messages.findIndex((m) => m.id === opts.before) : messages.length;
  const start = Math.max(0, end - limit);
  return { items: messages.slice(start, end), nextCursor: start > 0 ? messages[start].id : null };
}

export function mockSendMessage(id: string, text: string, image?: File): Message {
  const s = get(id);
  if (s.conv.blockedMe || s.conv.blockedByMe) throw new ApiError('Envoi impossible : conversation bloquée.', 403, 'BLOCKED');

  const safe = maskContactInfo(text);
  const moderation: MessageModeration[] = [];
  if (safe.masked) moderation.push('contact_masked');
  if (safe.linkBlocked) moderation.push('link_blocked');

  const m: Message = {
    id: nextId('m'), conversationId: id, kind: image ? 'image' : 'text', fromMe: true,
    text: safe.text || undefined, createdAt: new Date().toISOString(),
    ...(image ? { image: { url: globalThis.URL.createObjectURL(image) } } : {}),
    ...(moderation.length ? { moderation } : {}),
  };
  s.messages.push(m);
  touch(s, m);

  setTimeout(() => {
    s.conv.participantLastReadAt = new Date().toISOString();
    const reply = msg(id, false, 'Merci pour votre message, je reviens vers vous rapidement.', new Date().toISOString());
    s.messages.push(reply);
    s.conv.unreadCount += 1;
    touch(s, reply);
  }, AUTO_REPLY_MS);

  return { ...m };
}

export function mockMarkRead(id: string) {
  const s = get(id);
  s.conv.unreadCount = 0;
}

export function mockSetBlocked(id: string, blocked: boolean): Conversation {
  const s = get(id);
  s.conv.blockedByMe = blocked;
  return { ...s.conv };
}

export const mockUnreadTotal = () =>
  [...store.values()].reduce((n, s) => n + s.conv.unreadCount, 0);
