// lib/mock.ts — Bascule mock / API réelle pour les services V2.1
//
// NEXT_PUBLIC_USE_MOCKS :
//   true (ou absent) : tout en données de démo (src/mocks/) ;
//   mixed            : routes livrées par le backend en réel (src/lib/liveEndpoints.ts), le reste en démo ;
//   false            : tout en réel.
import { NotLiveError } from './liveEndpoints';

export type ApiMode = 'mock' | 'mixed' | 'live';

const RAW_MODE = process.env.NEXT_PUBLIC_USE_MOCKS;
export const API_MODE: ApiMode = RAW_MODE === 'false' ? 'live' : RAW_MODE === 'mixed' ? 'mixed' : 'mock';
export const USE_MOCKS = API_MODE === 'mock';

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
  if (API_MODE === 'live') return real();
  if (API_MODE === 'mixed') {
    try {
      return await real();
    } catch (err) {
      if (!(err instanceof NotLiveError)) throw err;
    }
  }
  await delay(MOCK_LATENCY_MS);
  return mock();
}

export const toQuery = (params: object) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
