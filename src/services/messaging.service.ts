import api from '@/lib/api';
import { toQuery, withMock } from '@/lib/mock';
import {
  mockGetConversation, mockListConversations, mockListMessages, mockMarkRead, mockOpenConversation, mockSendMessage, mockSetBlocked,
} from '@/mocks/messages.mock';
import type { ApiResponse, Conversation, CursorPage, Message, OpenConversationInput } from '@/types';

const enc = encodeURIComponent;

export const messagingService = {
  /** GET /conversations?q=&cursor= — mes conversations non vides, les plus récentes d'abord. */
  list(q?: string, cursor?: string | null) {
    return withMock(
      () => mockListConversations(q),
      async () => {
        const qs = toQuery({ q, cursor });
        return (await api.get<ApiResponse<CursorPage<Conversation>>>(`/conversations${qs ? `?${qs}` : ''}`)).data;
      },
    );
  },

  /** GET /conversations/:id */
  get(id: string) {
    return withMock(
      () => mockGetConversation(id),
      async () => (await api.get<ApiResponse<Conversation>>(`/conversations/${enc(id)}`)).data,
    );
  },

  /** POST /conversations/open { recipientId, itemId? } — trouve ou crée la conversation (idempotent). */
  open(input: OpenConversationInput) {
    return withMock(
      () => mockOpenConversation(input),
      async () => (await api.post<ApiResponse<Conversation>>(`/conversations/open`, input)).data,
    );
  },

  /**
   * GET /conversations/:id/messages
   *  - ?before=<messageId>&limit= : historique (ordre chronologique, nextCursor = plus anciens)
   *  - ?after=<messageId>          : nouveaux messages depuis le dernier connu (polling)
   */
  messages(id: string, opts: { before?: string; after?: string; limit?: number } = {}) {
    return withMock(
      () => mockListMessages(id, opts),
      async () => {
        const qs = toQuery(opts);
        return (await api.get<ApiResponse<CursorPage<Message>>>(`/conversations/${enc(id)}/messages${qs ? `?${qs}` : ''}`)).data;
      },
    );
  },

  /** POST /conversations/:id/messages — multipart : text?, image? ; renvoie le message tel que modéré par le serveur. */
  send(id: string, text: string, image?: File) {
    return withMock(
      () => mockSendMessage(id, text, image),
      async () => {
        const form = new FormData();
        if (text) form.append('text', text);
        if (image) form.append('image', image);
        return (await api.post<ApiResponse<Message>>(`/conversations/${enc(id)}/messages`, form)).data;
      },
    );
  },

  /** POST /conversations/:id/read — marque les messages reçus comme lus. */
  markRead(id: string) {
    return withMock(
      () => mockMarkRead(id),
      async () => { await api.post(`/conversations/${enc(id)}/read`); },
    );
  },

  /** POST|DELETE /conversations/:id/block — bloquer / débloquer l'autre participant. */
  setBlocked(id: string, blocked: boolean) {
    return withMock(
      () => mockSetBlocked(id, blocked),
      async () => {
        const url = `/conversations/${enc(id)}/block`;
        return (await (blocked ? api.post<ApiResponse<Conversation>>(url) : api.delete<ApiResponse<Conversation>>(url))).data;
      },
    );
  },
};
