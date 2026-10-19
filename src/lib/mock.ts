// lib/mock.ts — Bascule mock / API réelle pour les services V2.1
//
// Tant que le backend n'expose pas un endpoint, le front tourne sur les mocks.
// Pour brancher l'API : NEXT_PUBLIC_USE_MOCKS=false dans .env

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';

const MOCK_LATENCY_MS = 350;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exécute `mock` en mode démo, sinon `real`.
 * Le mock renvoie directement la donnée (équivalent de `res.data`).
 */
export async function withMock<T>(
  mock: () => T | Promise<T>,
  real: () => Promise<T>,
): Promise<T> {
  if (!USE_MOCKS) return real();
  await delay(MOCK_LATENCY_MS);
  return mock();
}

export const toQuery = (params: object) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
