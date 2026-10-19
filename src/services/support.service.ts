import api from '@/lib/api';
import { withMock } from '@/lib/mock';

export type SupportSubject = 'info' | 'probleme' | 'annonce' | 'paiement' | 'compte' | 'autre';

export interface SupportMessage {
  name: string;
  email: string;
  subject: SupportSubject;
  message: string;
}

export const supportService = {
  /** POST /contacts/general (endpoint V1 existant, public). */
  send(input: SupportMessage) {
    return withMock(
      () => ({ received: true }),
      async () => { await api.post('/contacts/general', input, { auth: false }); return { received: true }; },
    );
  },
};
