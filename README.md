# LUDRA HOME — Frontend (V2.1)

Plateforme sociale transactionnelle : **immobilier**, **placement du personnel** et **autres services** au Cameroun.
Next.js 15 (App Router) · React 18 · TypeScript · Tailwind CSS · NextAuth v4.

## Démarrer

```bash
cp .env.example .env    # puis renseigner NEXTAUTH_SECRET
npm install
npm run dev             # http://localhost:3000
```

## Mode mock / API réelle

Chaque écran V2.1 passe par un service typé (`src/services/`) qui fonctionne en deux modes :

| `NEXT_PUBLIC_USE_MOCKS` | Comportement |
|---|---|
| absent ou `true` | Données de démo (`src/mocks/`), latence simulée, état gardé dans le `localStorage` du navigateur |
| **`mixed`** (production actuelle) | Routes déjà livrées par le backend en réel, toutes les autres en démo |
| `false` | Appels HTTP vers `NEXT_PUBLIC_API_URL` pour tout (endpoints décrits dans `docs/API_CONTRACT_V2.1.md`) |

**Mode `mixed`** : la liste des routes livrées est dans [`src/lib/liveEndpoints.ts`](src/lib/liveEndpoints.ts). Le client API (`src/lib/api.ts`) refuse les autres routes, et `withMock` bascule alors sur la démo — aucun service n'est à modifier. Quand le backend livre un endpoint, **ajouter sa ligne dans `liveEndpoints.ts`**. Chaque objet reste sur la source qui l'a créé : les identifiants de démo utilisent un tiret (`pay-…`, `dr-…`, `cv-…`), ceux du backend un tiret bas ou un id Firebase. Cas particuliers du mode mixte :
- feed : onglet Personnel servi par `GET /search?universe=personnel`, profils candidats de démo retirés de l'onglet « Tous » (`feed.service.ts`) ;
- badges du header : reconstitués depuis `/notifications` et `/conversations` tant que `GET /me/counters` n'existe pas (`me.service.ts`) ;
- publication : un brouillon `personnel` est créé dans le backend, un brouillon immobilier ou services reste en démo ; changer de type recrée le brouillon du bon côté (`PublishPage.tsx`).

Le backend implémente le contrat décrit dans **[`docs/API_CONTRACT_V2.1.md`](docs/API_CONTRACT_V2.1.md)** ; les types de référence sont dans `src/types/`.
Pour repartir de données de démo propres : vider le `localStorage` (clés `ludra.mock.*`).

Scénarios de démo utiles :
- paiement Mobile Money : confirmé ~6 s après la demande ; un numéro finissant par `0000` simule un échec ;
- certification : un fichier nommé `*flou*` provoque un rejet ;
- back-office : se connecter avec un compte de rôle `admin` / `proprietaire`.

## Organisation

```
src/
  app/                 routes (App Router) — pages fines qui rendent une vue
  views/               écrans : auth, feed, search, listing, messages, publish, certification,
                       subscriptions, reviews, personnel, services, account, admin, static
  components/       shell (header, rails, nav basse), ui (Modal, Form, Pill…), payment,
                       plans, reviews, report, notifications, admin
  services/         accès API (mock ou réel)
  mocks/               données et règles de démo
  types/            contrat de données
  lib/                 api (fetch + refresh token), mock, searchFilters, permissions…
docs/
  V2.1_ROADMAP.md      étapes, routes, anciennes routes supprimées (redirections dans next.config.ts)
  API_CONTRACT_V2.1.md contrat frontend ⇄ backend
```

Responsive : mobile ≤ 767 px (nav basse), tablette, desktop ≥ 1200 px (`desk:`, rails latéraux).
Les modales deviennent des bottom sheets sur mobile (`components/ui/Modal.tsx`).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement (Turbopack) |
| `npm run build` | build de production |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | vérification des types |
