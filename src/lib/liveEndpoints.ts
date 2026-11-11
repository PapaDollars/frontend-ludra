// lib/liveEndpoints.ts — Routes déjà livrées par le backend (mode `mixed`)
//
// En mode `NEXT_PUBLIC_USE_MOCKS=mixed`, seules ces routes appellent l'API ; les autres gardent
// les données de démo (voir `withMock`). Quand le backend livre un endpoint : l'ajouter ici.
//
// Les identifiants de démo utilisent un tiret (`pay-…`, `dr-…`, `cv-…`, `u-…`, `c-001`) et ceux du
// backend un tiret bas (`pay_…`, `dr_…`, `cv_…`) ou un id Firebase : chaque objet reste ainsi
// sur la source qui l'a créé (un paiement de démo est suivi en démo, un brouillon réel en réel).

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface LiveRoute {
  method: Method;
  /** Chemin sans query string, ex. /^\/drafts\/[^/]+$/ */
  path: RegExp;
  /** Condition supplémentaire (query string, corps JSON). */
  when?: (query: URLSearchParams, body: Record<string, unknown> | null) => boolean;
}

const MOCK_ID = /^(pay|dr|cv|up|kd)-|^u-|^c-\d+$/;
/** Segment d'URL qui désigne un objet du backend (et non un objet de démo). */
const realId = (path: string, index: number) => {
  const seg = decodeURIComponent(path.split('/')[index] ?? '');
  return Boolean(seg) && !MOCK_ID.test(seg);
};

/** Identifiant créé par les données de démo (et non par le backend). */
export const isMockId = (id: string | null | undefined) => Boolean(id) && MOCK_ID.test(String(id));

/** Univers servi par le backend pour la recherche et la publication. */
const LIVE_UNIVERSES = ['personnel'];
export const isLiveUniverse = (universe: string | null | undefined) => LIVE_UNIVERSES.includes(String(universe ?? ''));
const liveUniverse = (q: URLSearchParams) => LIVE_UNIVERSES.includes(q.get('universe') ?? '');

const ROUTES: (LiveRoute & { ids?: number[] })[] = [
  // ── Authentification et compte de base ──
  { method: 'POST', path: /^\/auth\/(send-code|register|login|refresh-token|forgot-password|reset-password|logout)$/ },
  { method: 'GET', path: /^\/auth\/me$/ },
  { method: 'PUT', path: /^\/users\/profile$/ },
  { method: 'POST', path: /^\/users\/(profile\/avatar|request-deletion|cancel-deletion)$/ },
  { method: 'POST', path: /^\/contacts\/general$/ },

  // ── Notifications ──
  { method: 'GET', path: /^\/notifications$/ },
  { method: 'POST', path: /^\/notifications\/(read-all|[^/]+\/read)$/ },

  // ── Recherche (référentiels pour tous ; résultats pour l'univers personnel) ──
  { method: 'GET', path: /^\/search\/(options|suggestions)$/ },
  { method: 'GET', path: /^\/search(\/count)?$/, when: liveUniverse },

  // ── Placement du personnel ──
  { method: 'GET', path: /^\/candidates\/[^/]+$/, ids: [2] },
  { method: 'GET', path: /^\/me\/candidate-profile$/ },
  { method: 'GET', path: /^\/recruiter\/(access|shortlist|shortlist\/export)$/ },
  { method: 'POST', path: /^\/recruiter\/shortlist$/, when: (_q, b) => !MOCK_ID.test(String(b?.candidateId ?? '')) },
  { method: 'DELETE', path: /^\/recruiter\/shortlist\/[^/]+$/, ids: [3] },

  // ── Abonnements et paiements ──
  { method: 'GET', path: /^\/plans$/ },
  { method: 'GET', path: /^\/subscriptions\/me$/ },
  { method: 'POST', path: /^\/payments\/subscription$/ },
  { method: 'GET', path: /^\/payments\/[^/]+$/, ids: [2] },
  { method: 'GET', path: /^\/me\/payments$/ },
  { method: 'GET', path: /^\/me\/payments\/[^/]+$/, ids: [3] },

  // ── Messagerie (texte) ──
  { method: 'GET', path: /^\/conversations$/ },
  { method: 'POST', path: /^\/conversations\/open$/, when: (_q, b) => !MOCK_ID.test(String(b?.recipientId ?? '')) && !MOCK_ID.test(String(b?.itemId ?? '')) },
  { method: 'GET', path: /^\/conversations\/[^/]+(\/messages)?$/, ids: [2] },
  { method: 'POST', path: /^\/conversations\/[^/]+\/(messages|read|block)$/, ids: [2] },
  { method: 'DELETE', path: /^\/conversations\/[^/]+\/block$/, ids: [2] },

  // ── Publication (brouillons personnel ; images) ──
  { method: 'GET', path: /^\/drafts$/ },
  { method: 'POST', path: /^\/drafts$/, when: (_q, b) => LIVE_UNIVERSES.includes(String(b?.type ?? '')) },
  { method: 'GET', path: /^\/drafts\/[^/]+$/, ids: [2] },
  { method: 'PATCH', path: /^\/drafts\/[^/]+$/, ids: [2] },
  { method: 'DELETE', path: /^\/drafts\/[^/]+$/, ids: [2] },
  { method: 'POST', path: /^\/drafts\/[^/]+\/publish$/, ids: [2] },
  { method: 'POST', path: /^\/uploads$/ },

  // ── Back-office ──
  { method: 'GET', path: /^\/admin\/(stats|users|proofs|payments)$/ },
  { method: 'PATCH', path: /^\/admin\/users\/[^/]+$/ },
  { method: 'POST', path: /^\/admin\/proofs\/[^/]+\/decision$/ },
  { method: 'POST', path: /^\/admin\/payments\/[^/]+\/reconcile$/, ids: [3] },
];

const parseBody = (body: unknown): Record<string, unknown> | null => {
  if (typeof body !== 'string') return null;
  try { return JSON.parse(body); } catch { return null; }
};

/** La route `method endpoint` (avec query string éventuelle) est-elle servie par le backend ? */
export function isLiveEndpoint(method: string, endpoint: string, body?: unknown): boolean {
  const [path, qs = ''] = endpoint.split('?');
  const query = new URLSearchParams(qs);
  const json = parseBody(body);
  return ROUTES.some((r) => r.method === method.toUpperCase()
    && r.path.test(path)
    && (r.ids ?? []).every((i) => realId(path, i))
    && (!r.when || r.when(query, json)));
}

/** Levée par le client API en mode `mixed` pour une route pas encore livrée ; `withMock` bascule alors sur la démo. */
export class NotLiveError extends Error {
  constructor(method: string, endpoint: string) {
    super(`Route non livrée par le backend : ${method} ${endpoint}`);
    this.name = 'NotLiveError';
  }
}
