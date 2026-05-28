const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Flag pour éviter plusieurs signOut simultanés
let isSigningOut = false;

/**
 * Déconnexion complète : vide localStorage + session NextAuth + redirige vers login.
 * Appelé quand le token est expiré et que toutes les tentatives de refresh ont échoué.
 */
async function forceSignOut(): Promise<void> {
  if (isSigningOut) return;
  isSigningOut = true;
  clearTokens();
  try {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/auth/login', redirect: false });
  } catch { /* ignore */ }
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}

/**
 * Quand localStorage est vide mais la session NextAuth existe encore,
 * on tente de restaurer les tokens depuis la session.
 */
async function tryRestoreFromSession(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { getSession } = await import('next-auth/react');
    const session = await getSession() as any;
    if (session?.accessToken) {
      setTokens(session.accessToken, session.refreshToken || '');
      return session.accessToken;
    }
  } catch { /* silencieux */ }
  return null;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { clearTokens(); return null; }
    const data = await res.json();
    localStorage.setItem('accessToken', data.data.accessToken);
    if (data.data.refreshToken) {
      localStorage.setItem('refreshToken', data.data.refreshToken);
    }
    return data.data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
  retry?: boolean;
}

async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = true, retry = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(fetchOptions.body && !(fetchOptions.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 403) {
    const errorData = await response.json();
    if (errorData.code === 'ACCOUNT_DISABLED') {
      forceSignOut();
      throw new Error(errorData.message || 'Votre compte a été restreint. Déconnexion en cours…');
    }
    throw new Error(errorData.message || 'Accès refusé.');
  }

  if (response.status === 401 && retry && auth) {
    const existingToken = getToken();

    if (existingToken) {
      // Token présent mais expiré → tenter le refresh
      const newToken = await refreshAccessToken();
      if (newToken) return request<T>(endpoint, { ...options, retry: false });
      clearTokens();
    }

    // Aucun token localStorage → tenter de restaurer depuis la session NextAuth
    const restoredToken = await tryRestoreFromSession();
    if (restoredToken) {
      return request<T>(endpoint, { ...options, retry: false });
    }

    // Tout a échoué → déconnecter proprement l'utilisateur
    forceSignOut();
    throw new Error('Session expirée. Reconnexion en cours…');
  }

  const data = await response.json();

  if (!response.ok) {
    // Si le backend renvoie des erreurs de validation détaillées, les inclure
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const details = data.errors.map((e: any) => e.msg || e.message || '').filter(Boolean).join(' • ');
      throw new Error(details || data.message || `Erreur ${response.status}`);
    }
    throw new Error(data.message || `Erreur ${response.status}`);
  }

  return data;
}

export const api = {
  get: <T = any>(url: string, opts?: RequestOptions) =>
    request<T>(url, { method: 'GET', ...opts }),

  post: <T = any>(url: string, body?: any, opts?: RequestOptions) =>
    request<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...opts,
    }),

  put: <T = any>(url: string, body?: any, opts?: RequestOptions) =>
    request<T>(url, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...opts,
    }),

  patch: <T = any>(url: string, body?: any, opts?: RequestOptions) =>
    request<T>(url, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...opts,
    }),

  delete: <T = any>(url: string, opts?: RequestOptions) =>
    request<T>(url, { method: 'DELETE', ...opts }),
};

export default api;
