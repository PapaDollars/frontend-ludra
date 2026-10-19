import api from '@/lib/api';
import { toQuery, withMock } from '@/lib/mock';
import {
  mockChangePassword, mockContactUnlocks, mockEditDraft, mockMyItems, mockOverview, mockPayment, mockPayments, mockPreferences,
  mockProfile, mockSetItemStatus, mockSetPreferences, mockUpdateProfile,
} from '@/mocks/account.mock';
import type {
  AccountOverview, AccountProfile, ApiResponse, ContactUnlock, MyItem, MyItemStatus, MyItemStatusChange, NotificationPreferences,
  PaymentRecord, PublishDraft,
} from '@/types';

const enc = encodeURIComponent;

/** Mon compte (M15) — toutes les routes sont auth. `fallback` = infos de session, utilisées par les mocks uniquement. */
export const accountService = {
  /** GET /me/overview — compteurs du tableau de bord. */
  overview(fallback: Partial<AccountProfile>) {
    return withMock(
      () => mockOverview(fallback),
      async () => (await api.get<ApiResponse<AccountOverview>>(`/me/overview`)).data,
    );
  },

  // ── Mes publications ──

  /** GET /me/items?status= — annonces, profil candidat, services de l'utilisateur. */
  items(status: MyItemStatus | 'all' = 'all') {
    return withMock(
      () => mockMyItems(status),
      async () => (await api.get<ApiResponse<MyItem[]>>(`/me/items${status !== 'all' ? `?${toQuery({ status })}` : ''}`)).data,
    );
  },

  /** PATCH /me/items/:id/status { status } — active | paused | rented | archived. */
  setItemStatus(id: string, status: MyItemStatusChange) {
    return withMock(
      () => mockSetItemStatus(id, status),
      async () => (await api.patch<ApiResponse<MyItem>>(`/me/items/${enc(id)}/status`, { status })).data,
    );
  },

  /** POST /me/items/:id/edit — brouillon pré-rempli (`sourceItemId`) ; sa publication met à jour l'existant. */
  editDraft(id: string) {
    return withMock(
      () => mockEditDraft(id),
      async () => (await api.post<ApiResponse<PublishDraft>>(`/me/items/${enc(id)}/edit`)).data,
    );
  },

  // ── Paiements ──

  /** GET /me/payments — historique (plus récents d'abord). */
  payments() {
    return withMock(
      () => mockPayments(),
      async () => (await api.get<ApiResponse<PaymentRecord[]>>(`/me/payments`)).data,
    );
  },

  /** GET /me/payments/:id — détail / reçu. */
  payment(id: string) {
    return withMock(
      () => mockPayment(id),
      async () => (await api.get<ApiResponse<PaymentRecord>>(`/me/payments/${enc(id)}`)).data,
    );
  },

  /** GET /me/unlocks — contacts débloqués. */
  unlocks() {
    return withMock(
      () => mockContactUnlocks(),
      async () => (await api.get<ApiResponse<ContactUnlock[]>>(`/me/unlocks`)).data,
    );
  },

  // ── Profil & sécurité (endpoints V1 existants réutilisés) ──

  /** GET /auth/me (V1). */
  profile(fallback: Partial<AccountProfile>) {
    return withMock(
      () => mockProfile(fallback),
      async () => (await api.get<ApiResponse<AccountProfile>>('/auth/me')).data,
    );
  },

  /** PUT /users/profile (V1) { name, phone, city, whatsapp }. */
  updateProfile(fallback: Partial<AccountProfile>, patch: Pick<AccountProfile, 'name' | 'city' | 'phone' | 'whatsapp'>) {
    return withMock(
      () => mockUpdateProfile(fallback, patch),
      async () => (await api.put<ApiResponse<AccountProfile>>('/users/profile', patch)).data,
    );
  },

  /** POST /users/profile/avatar (V1) — multipart `avatar`. */
  uploadAvatar(fallback: Partial<AccountProfile>, file: File) {
    return withMock(
      () => mockUpdateProfile(fallback, { avatar: globalThis.URL.createObjectURL(file) }),
      async () => {
        const fd = new FormData();
        fd.append('avatar', file);
        await api.post('/users/profile/avatar', fd);
        return (await api.get<ApiResponse<AccountProfile>>('/auth/me')).data;
      },
    );
  },

  /** POST /users/request-deletion · /users/cancel-deletion (V1). */
  setDeletionRequested(fallback: Partial<AccountProfile>, requested: boolean) {
    return withMock(
      () => mockUpdateProfile(fallback, { deletionRequestedAt: requested ? new Date().toISOString() : null }),
      async () => {
        await api.post(requested ? '/users/request-deletion' : '/users/cancel-deletion');
        return (await api.get<ApiResponse<AccountProfile>>('/auth/me')).data;
      },
    );
  },

  /** GET /me/preferences */
  preferences() {
    return withMock(
      () => mockPreferences(),
      async () => (await api.get<ApiResponse<NotificationPreferences>>(`/me/preferences`)).data,
    );
  },

  /** PUT /me/preferences */
  setPreferences(p: NotificationPreferences) {
    return withMock(
      () => mockSetPreferences(p),
      async () => (await api.put<ApiResponse<NotificationPreferences>>(`/me/preferences`, p)).data,
    );
  },

  /** POST /me/password { currentPassword, newPassword } — 403 WRONG_PASSWORD. */
  changePassword(currentPassword: string, newPassword: string) {
    return withMock(
      () => mockChangePassword(currentPassword, newPassword),
      async () => (await api.post<ApiResponse<{ changed: boolean }>>(`/me/password`, { currentPassword, newPassword })).data,
    );
  },

  /** POST /me/logout-all — révoque tous les refresh tokens. */
  logoutAll() {
    return withMock(
      () => ({ revoked: true }),
      async () => (await api.post<ApiResponse<{ revoked: boolean }>>(`/me/logout-all`)).data,
    );
  },
};
