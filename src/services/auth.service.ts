import api, { setTokens, clearTokens } from '@/lib/api';

export interface LoginPayload {
  emailOrPhone: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'user' | 'landlord';
  city?: string;
}

export const authService = {
  async login(payload: LoginPayload) {
    const res = await api.post('/auth/login', payload, { auth: false });
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data;
  },

  async register(payload: RegisterPayload) {
    const res = await api.post('/auth/register', payload, { auth: false });
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data;
  },

  async logout() {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearTokens();
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async forgotPassword(email: string) {
    return api.post('/auth/forgot-password', { email }, { auth: false });
  },

  async resetPassword(token: string, password: string, confirmPassword: string) {
    return api.post('/auth/reset-password', { token, password, confirmPassword }, { auth: false });
  },
};
