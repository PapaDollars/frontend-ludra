# LUDRA HOME V2.1 — Contrat API (frontend ⇄ backend)

Ce document liste les endpoints **attendus par le frontend**. Le front tourne en mode
mixte (`NEXT_PUBLIC_USE_MOCKS=mixed`) : les routes déjà livrées appellent le backend, les
autres utilisent les mocks. Dès qu'un endpoint est livré avec la forme ci-dessous, on
l'ajoute à `src/lib/liveEndpoints.ts` ; quand tout est livré, `NEXT_PUBLIC_USE_MOCKS=false`.

- Base : `NEXT_PUBLIC_API_URL` (ex. `http://localhost:5000/api`).
- Tous les endpoints sont montés directement sous **`/api`** (pas de préfixe de version). Les routes V1 qui avaient le même chemin ont été remplacées et les routes V1 inutilisées supprimées (voir étape 12).
- Auth : `Authorization: Bearer <accessToken>` (mêmes JWT qu'aujourd'hui). « Public » = token optionnel ; s'il est présent, il personnalise la réponse (ex. `isFavorite`).
- Enveloppe : `{ "success": true, "data": <payload>, "message"?: string }`.
- Erreurs : statut HTTP + `{ "success": false, "message": string, "errors"?: [{ "msg": string }] }`. `403` + `code: "ACCOUNT_DISABLED"` déconnecte l'utilisateur.
- Montants : entiers en FCFA. Dates : ISO 8601 UTC.
- **Types TypeScript de référence : `src/types/`** — ils font foi en cas de doute.
- Mocks de référence (exemples de réponses réalistes) : `src/mocks/`.

## Règles de coût Firestore (forfait Spark : 50 000 lectures, 20 000 écritures / jour)

Chaque document lu est facturé, même s'il est filtré ensuite dans le code. Dépassement = application bloquée jusqu'à minuit (heure du Pacifique).

1. **Recherche / listes** (`/search`, `/feed`, `/saved`, `/me/items`, conversations, avis…) : filtrer avec `where` côté Firestore, `orderBy` + `limit(n + 1)` + `startAfter` (curseur = valeurs du dernier élément, pas un offset : `offset()` facture les documents sautés). Jamais `collection.get()` puis filtre en JavaScript.
2. **Distance** : pas de requête de proximité native. Pré-filtrer par ville / quartier (ou geohash avec bornes) avant tout calcul de distance.
3. **Compteurs** (`total`, `/search/count`, `/me/counters`, statistiques admin) : agrégation `query.count().get()` (1 lecture par tranche de 1 000), jamais `.size` sur une collection lue.
4. **N+1** : pour enrichir une liste (publieur d'une annonce, profil d'un candidat), `db.getAll(...refs)` ou recopier dans le document les champs affichés (nom, avatar, badge vérifié).
5. **Vues / clics** : au plus une écriture par visiteur, par objet et par jour (dédoublonnage mémoire côté serveur) + limite de débit sur la route.
6. **Données qui changent rarement** (paramètres admin, plans, catégories de services, options de recherche) : cache mémoire avec durée de vie, vidé dans chaque route d'écriture correspondante.
7. **Utilisateur connecté** : `req.user` est déjà chargé (cache 60 s, `backend-ludra/src/utils/userCache.js`) — ne pas relire `users/{id}`. Après toute écriture sur `users/{id}` : `invalidateUser(id)`.
8. **Index composites** : à déclarer dans `backend-ludra/firestore.indexes.json` (déploiement : `firebase deploy --only firestore:indexes`).
9. **Idempotence** : création avec id déterministe + `create()` (refus si l'id existe) ou clé `Idempotency-Key` (paiements), pour qu'un nouvel essai ne crée pas de doublon.

Le front ne fait aucun appel de fond quand l'onglet est masqué (compteurs, messagerie, KYC) et ne lance la recherche qu'après un délai de saisie.

## Règles de sécurité non négociables

1. Aucun numéro de téléphone / WhatsApp dans une réponse avant paiement `unlock_contact` confirmé par webhook (M04).
2. Aucun document KYC (CNI, titre, carte pro) dans une réponse publique ; seulement `verified: boolean` (M07, M11).
3. Permissions calculées côté serveur (RBAC §6.1) : le front masque, le serveur refuse.
4. Prix, quotas et boosts administrables (M16) : aucun montant n'est codé en dur côté front.
5. Mise en avant commerciale ⇒ `sponsored: true` (affiché « Sponsorisé »), avec quota de résultats organiques (§11).

---

## Étape 1 — Feed (Module 01) ✅ front prêt

### `GET /api/feed` — public

Feed mixte des trois univers, trié par le classement §11 (pertinence, fraîcheur, qualité, confiance, plan borné, pénalité risque).

| Query | Type | Description |
|-------|------|-------------|
| `universe` | `immobilier \| personnel \| services` | optionnel ; absent = tous |
| `city` | string | optionnel |
| `cursor` | string | curseur opaque renvoyé par la page précédente |
| `limit` | int | défaut 5–20 |

Réponse `data` : `CursorPage<FeedItem>`

```json
{
  "items": [
    {
      "id": "l-001",
      "universe": "immobilier",
      "publisher": { "id": "u-nadia", "name": "Nadia L.", "avatar": null, "kind": "owner", "verified": true, "rating": 4.7, "reviewsCount": 26, "city": "Yaoundé" },
      "title": "Appartement moderne à Bastos",
      "city": "Yaoundé",
      "district": "Bastos",
      "media": [{ "url": "https://…", "type": "image" }],
      "createdAt": "2026-10-15T08:35:00.000Z",
      "isFavorite": false,
      "sponsored": false,
      "transaction": "location",
      "propertyKind": "appartement",
      "price": 85000,
      "priceUnit": "mois",
      "bedrooms": 2,
      "bathrooms": 2,
      "surface": 110,
      "amenities": ["parking"],
      "availableNow": true
    },
    {
      "id": "c-001",
      "universe": "personnel",
      "publisher": { "id": "u-clarisse", "name": "Clarisse N.", "kind": "candidate", "verified": true },
      "title": "Chauffeure expérimentée — permis B",
      "city": "Yaoundé", "media": [], "createdAt": "…", "isFavorite": false, "sponsored": false,
      "job": "Chauffeure", "jobCode": "chauffeur", "experienceYears": 6, "availability": "immediate", "plan": "premium", "trained": true
    },
    {
      "id": "s-001",
      "universe": "services",
      "publisher": { "id": "u-jean", "name": "Jean Sarl", "kind": "provider", "verified": true },
      "title": "Déménagement Yaoundé & environs",
      "city": "Yaoundé", "media": [], "createdAt": "…", "isFavorite": false, "sponsored": false,
      "category": "demenagement", "categoryLabel": "Déménagement",
      "summary": "Manutention, emballage et transport.", "priceFrom": 25000, "regulated": false
    }
  ],
  "nextCursor": "eyJvZmZzZXQiOjV9",
  "total": 128
}
```

Valeurs d'énumération :
- `publisher.kind` : `owner | agent | candidate | recruiter | provider | user`
- `transaction` : `location | vente` · `priceUnit` : `mois | nuit | total`
- `propertyKind` : `appartement | studio | chambre | maison | villa | terrain | bureau | commerce`
- `availability` : `immediate | sous_15_jours | a_convenir` · `plan` : `gratuit | standard | premium`
- `amenities` : **libellés affichables** (ex. `"meublé"`) ; le filtrage, lui, utilise les codes de `GET /search/options`.
- `jobCode` : code métier normalisé (référentiel `jobs` de `GET /search/options`) ; `job` est le libellé affiché.

`nextCursor: null` = fin du feed.

### `GET /api/feed/suggested-accounts?universe=` — public

Rail droit « Comptes vérifiés ». `data` : `Publisher[]` (3 à 5 comptes, `verified: true`).

### `GET /api/me/counters` — auth

Badges du header. `data` : `{ "unreadMessages": 3, "unreadNotifications": 2 }`. Interrogé toutes les 30 s.

### `POST /api/saved/toggle` — auth

Enregistrer / retirer un élément de n'importe quel univers.
Body : `{ "itemId": "l-001", "universe": "immobilier" }`
`data` : `{ "itemId": "l-001", "isFavorite": true }`
(Autres routes favoris : étape 10.)

---

## Étape 2 — Recherche & filtres (Module 02) ✅ front prêt

Format des filtres (query string), identique pour l'URL de la page `/recherche` et pour l'API.
Type de référence : `SearchFilters` (`src/types/search.ts`) ; sérialisation : `src/lib/searchFilters.ts`.

| Param | Univers | Type | Description |
|-------|---------|------|-------------|
| `universe` | tous | `immobilier \| personnel \| services` | **toujours présent** |
| `q` | tous | string | texte libre : titre, quartier, métier, service, nom du publieur (insensible casse/accents) |
| `city`, `district` | tous | string | valeurs issues de `options.cities` |
| `verifiedOnly` | tous | `true` | publieur KYC validé uniquement |
| `sort` | tous | `pertinence \| recent \| prix_asc \| prix_desc` | défaut `pertinence` (absent = pertinence) |
| `transaction` | immobilier | `location \| vente` | |
| `propertyKind` | immobilier | code `options.propertyKinds` | |
| `budgetMin`, `budgetMax` | immobilier | int FCFA | bornes incluses |
| `bedroomsMin` | immobilier | int | chambres ≥ |
| `surfaceMin` | immobilier | int m² | |
| `amenities` | immobilier | codes séparés par `,` | ex. `parking,eau_24_7` — **tous** requis (ET) |
| `availableNow` | immobilier | `true` | |
| `job` | personnel | code `options.jobs` | |
| `experienceMin` | personnel | int années | |
| `availability` | personnel | `immediate \| sous_15_jours` | `sous_15_jours` inclut `immediate` |
| `trainedOnly` | personnel | `true` | badge « Formé » sur preuve |
| `category` | services | code `options.serviceCategories` | |

Les paramètres d'un autre univers que `universe` sont ignorés. Paramètre inconnu → ignoré (pas d'erreur).

### `GET /api/search/options` — public

Référentiels administrables (back-office M16 ; catégories activables M14). Type `SearchOptions`.

```json
{
  "cities": [{ "name": "Yaoundé", "districts": ["Bastos", "Biyem-Assi", "Essos"] }],
  "propertyKinds": [{ "value": "appartement", "label": "Appartement" }],
  "amenities": [{ "value": "parking", "label": "Parking" }, { "value": "eau_24_7", "label": "Eau 24/7" }],
  "jobs": [{ "value": "chauffeur", "label": "Chauffeur" }],
  "serviceCategories": [{ "value": "plomberie", "label": "Plomberie" }]
}
```

### `GET /api/search?<filtres>&cursor=&limit=` — public (token optionnel)

Même réponse que le feed : `CursorPage<FeedItem>`, avec **`total` obligatoire** (affiché « N résultats »).
Le tri `pertinence` applique le classement §11 (plan payant = bonus borné ; contenus sponsorisés marqués `sponsored: true`).

### `GET /api/search/count?<filtres>` — public

Compteur live du bouton « Afficher N offres » (appelé avec anti-rebond de 300 ms à chaque changement de filtre).
`data` : `{ "total": 128 }`. Doit être rapide (pas de chargement des items).

### `GET /api/search/suggestions?q=` — public

Autocomplétion (q ≥ 2 caractères, 8 résultats max). Type `SearchSuggestion[]`.
`filters` est fusionné dans la recherche courante quand l'utilisateur choisit la suggestion.

```json
[
  { "kind": "district", "label": "Bastos", "hint": "Quartier · Yaoundé", "filters": { "city": "Yaoundé", "district": "Bastos" } },
  { "kind": "job", "label": "Chauffeur", "hint": "Métier", "filters": { "universe": "personnel", "job": "chauffeur" } },
  { "kind": "category", "label": "Plomberie", "hint": "Service", "filters": { "universe": "services", "category": "plomberie" } }
]
```
`kind` : `city | district | job | category`.

### Recherches sauvegardées + alertes — auth

Type `SavedSearch` : `{ id, name, filters: SearchFilters, alertEnabled, newResults, createdAt }`.
`newResults` = nouvelles offres correspondantes depuis la dernière consultation (badge « +N »).
Quand `alertEnabled` est vrai, le backend notifie l'utilisateur des nouvelles offres (notification + compteur `unreadNotifications`).

| Méthode | Endpoint | Body | `data` |
|---------|----------|------|--------|
| GET | `/api/saved-searches` | — | `SavedSearch[]` (plus récentes d'abord) |
| POST | `/api/saved-searches` | `{ name, filters, alertEnabled }` | `SavedSearch` créée |
| PATCH | `/api/saved-searches/:id` | `{ name?, alertEnabled? }` | `SavedSearch` à jour |
| DELETE | `/api/saved-searches/:id` | — | — |

`filters` est stocké tel quel (objet JSON `SearchFilters`) et renvoyé à l'identique.

---

## Étape 3 — Fiche bien + contact direct payant (Modules 03 & 04) ✅ front prêt

### `GET /api/listings/:id` — public (token optionnel)

Type `ListingDetail` (`src/types/listing.ts`) = `ListingFeedItem` (cf. feed) **+** :

```json
{
  "description": "Appartement lumineux, accès facile…",
  "media": [{ "url": "https://…", "type": "image" }, { "url": "https://…", "type": "image" }],
  "verification": { "identityVerified": true, "propertyDocumented": true },
  "contact": { "unlocked": false, "price": 500 },
  "viewerIsOwner": false
}
```

- `404` + `code: "NOT_FOUND"` si l'annonce n'existe pas / est retirée (le front affiche « Annonce introuvable »).
- `contact.price` : prix administrable (250–500 FCFA, M16).
- **`contact.phone` et `contact.whatsapp` ABSENTS** tant que `unlocked` est faux. Présents seulement si l'utilisateur connecté a un `unlock_contact` payé pour cette annonce, ou si `viewerIsOwner`.
- `verification` : statuts seulement, **jamais** d'URL ou de contenu de document.

### `GET /api/listings/:id/contact` — auth

`data` : `{ "phone": "+237 6 77 12 34 56", "whatsapp": "+237677123456" }` (`whatsapp` peut être `null`).
`402` + `code: "PAYMENT_REQUIRED"` si le déblocage n'est pas payé.

### `POST /api/payments/unlock-contact` — auth

Header `Idempotency-Key: <uuid>` (identique à `idempotencyKey` du body).

```json
{ "listingId": "l-001", "operator": "mtn_momo", "payerPhone": "677112233", "idempotencyKey": "6f1c…" }
```

- `operator` : `mtn_momo | orange_money` ; `payerPhone` : 9 chiffres `6XXXXXXXX` (déjà normalisé par le front).
- Le backend crée l'objet de paiement `unlock_contact` lié à **user + listing + publisher**, au prix administrable, et déclenche la demande Mobile Money (push USSD).
- `data` : `Payment` (`src/types/payment.ts`)

```json
{ "id": "pay-123", "purpose": "unlock_contact", "status": "pending", "amount": 500, "currency": "XAF",
  "operator": "mtn_momo", "listingId": "l-001", "createdAt": "2026-10-15T10:00:00.000Z" }
```

**Pas de double débit** (critère M04) :
- même `idempotencyKey` ⇒ renvoyer le **même** paiement (aucune nouvelle demande opérateur) ;
- contact déjà débloqué pour ce user + annonce ⇒ renvoyer un paiement `status: "paid"` sans débit ;
- un paiement `pending` existe déjà pour ce user + annonce ⇒ le renvoyer.

### `GET /api/payments/:id` — auth (propriétaire du paiement uniquement)

Même forme `Payment`. Le front interroge toutes les 3 s pendant 2 min maximum.
`status` : `pending | paid | failed | expired | cancelled`. Renseigner `failureReason` (texte lisible) si échec.

**Révélation uniquement après confirmation serveur/webhook** : `status` ne passe à `paid` que sur webhook opérateur vérifié (signature). Échec ou délai dépassé ⇒ contact toujours masqué. Après `paid`, le front appelle `GET /listings/:id/contact`.

### `POST /api/reports` — auth

Signalement transverse (annonces aujourd'hui ; profils, messages, avis aux étapes suivantes) → file de modération M16.

```json
{ "targetType": "listing", "targetId": "l-001", "reason": "arnaque", "details": "Demande une avance avant visite" }
```

`targetType` : `listing | user | message | review` · `reason` : `arnaque | fausse_annonce | doublon | contenu_inapproprie | deja_loue | autre` (`details` requis si `autre`).
`data` : `{ "received": true }`.

### Simulation en mode mock (pour tester sans backend)

Le paiement passe `paid` ~6 s après création. Un numéro payeur finissant par `0000` (ex. `690000000`) simule un échec.

---

## Étape 4 — Messagerie interne (Module 05) ✅ front prêt

Types : `src/types/messaging.ts`. Toutes les routes sont **auth** et réservées aux participants de la conversation (sinon `403`/`404`).

### `Conversation`

```json
{
  "id": "cv-1",
  "participant": { "id": "u-nadia", "name": "Nadia L.", "avatar": null, "kind": "owner", "verified": true },
  "context": { "universe": "immobilier", "itemId": "l-001", "title": "Appartement moderne à Bastos", "thumbnail": "https://…", "price": 85000, "priceUnit": "mois" },
  "lastMessage": { "text": "Bonjour…", "fromMe": false, "createdAt": "…" },
  "unreadCount": 1,
  "updatedAt": "…",
  "participantOnline": true,
  "participantLastReadAt": "…",
  "blockedByMe": false,
  "blockedMe": false
}
```

- `participant` : jamais de téléphone ni d'e-mail.
- `participantLastReadAt` : date de dernière lecture par l'autre ; le front affiche « Lu » sur mes messages antérieurs.
- `context` : `null` si conversation hors annonce.

### `Message`

```json
{ "id": "m-1", "conversationId": "cv-1", "kind": "text", "fromMe": true, "text": "…", "createdAt": "…",
  "moderation": ["contact_masked"] }
```

- `kind` : `text | image | system` (`image` : `{ "image": { "url": "…", "width": 800, "height": 600 } }`, `text` optionnel comme légende).
- `fromMe` : calculé par le serveur pour l'utilisateur connecté.
- `moderation` (optionnel) : `contact_masked | link_blocked | image_rejected`.

### Endpoints

| Méthode | Endpoint | Description | `data` |
|---------|----------|-------------|--------|
| GET | `/api/conversations?q=&cursor=` | Mes conversations **non vides**, `updatedAt` desc. `q` filtre sur nom / titre du contexte | `CursorPage<Conversation>` |
| GET | `/api/conversations/:id` | Détail | `Conversation` |
| POST | `/api/conversations/open` | Body `{ recipientId, itemId? }`. **Trouve ou crée** la conversation (unique par paire d'utilisateurs + item). Interdit de s'écrire à soi-même | `Conversation` |
| GET | `/api/conversations/:id/messages?before=<msgId>&limit=30` | Historique, **ordre chronologique** ; `nextCursor` = id du plus ancien renvoyé s'il en reste avant | `CursorPage<Message>` |
| GET | `/api/conversations/:id/messages?after=<msgId>` | Messages postérieurs (polling toutes les 4 s quand la conversation est ouverte) | `CursorPage<Message>` |
| POST | `/api/conversations/:id/messages` | **multipart/form-data** : `text?` (≤ 2000 car.), `image?` (JPG/PNG/WebP ≤ 5 Mo). Au moins l'un des deux | `Message` (tel que modéré) |
| POST | `/api/conversations/:id/read` | Marque les messages reçus comme lus (remet `unreadCount` à 0, met à jour `participantLastReadAt` côté autre) | — |
| POST | `/api/conversations/:id/block` | Bloquer l'autre participant | `Conversation` |
| DELETE | `/api/conversations/:id/block` | Débloquer | `Conversation` |

Signalement d'un participant : `POST /api/reports` avec `targetType: "user"` (cf. étape 3).

### Règles serveur (critères M05)

- **Aucune coordonnée révélée automatiquement** : masquer numéros de téléphone et e-mails dans `text` (remplacés par `[coordonnée masquée]`, `moderation: ["contact_masked"]`). Le front prévient l'utilisateur avant l'envoi, mais seul le serveur fait foi.
- **Liens suspects** : retirer les liens (`[lien retiré]`, `link_blocked`).
- **Images contrôlées** : vérification type/poids + modération ; refus ⇒ `image_rejected`.
- **Anti-spam** : limiter le débit ⇒ `429` (le front affiche « Vous envoyez trop de messages »).
- **Blocage** : `blockedMe` ou `blockedByMe` ⇒ envoi refusé `403` + `code: "BLOCKED"`.
- **Notification de nouveau message** : incrémenter `unreadMessages` de `GET /me/counters` (et notification push/e-mail selon préférences). Le front rafraîchit la liste toutes les 15 s et les compteurs toutes les 30 s. Un canal temps réel (WebSocket/SSE) pourra remplacer le polling sans changer ces formes.
- **Rétention** : conversation conservée selon la politique de rétention ; une conversation purgée renvoie `404`.

---

## Étape 5 — Publication « + Publier » (Module 06) ✅ front prêt

Types : `src/types/publish.ts`. Toutes les routes sont **auth** ; un brouillon n'est accessible qu'à son auteur.
Le même bouton « + Publier » sert à tous ; le rôle **Propriétaire / Agent** n'est demandé que pour un bien immobilier.

### `PublishDraft`

```json
{
  "id": "dr-1",
  "type": "immobilier",
  "step": 2,
  "listing": { "publisherRole": "owner", "transaction": "location", "propertyKind": "appartement", "title": "…", "description": "…",
               "city": "Yaoundé", "district": "Bastos", "price": 95000, "priceUnit": "mois", "bedrooms": 2, "bathrooms": 1,
               "surface": 80, "amenities": ["parking"], "availableNow": true },
  "candidate": {},
  "service": {},
  "media": [{ "id": "up-1", "url": "https://…", "type": "image" }],
  "updatedAt": "…"
}
```

- `type` : `immobilier | personnel | services | null` ; `step` : 0 type · 1 profil · 2 détails · 3 médias · 4 validation (dernière étape atteinte, pour la reprise).
- Les trois blocs `listing` / `candidate` / `service` coexistent : changer de type ne perd rien. Seul celui de `type` est publié.
- `candidate` : `{ job, title, summary, city, district, experienceYears, availability, salaryMin, salaryMax, skills[], training }` — `salaryMin/Max` = critère de ciblage, **jamais une garantie**.
- `service` : `{ category, structure: "independant" | "entreprise", businessName, title, description, city, priceFrom }`.
- Codes `propertyKind`, `amenities`, `job`, `category` : ceux de `GET /search/options`.

### Endpoints

| Méthode | Endpoint | Description | `data` |
|---------|----------|-------------|--------|
| GET | `/api/drafts` | Mes brouillons (plus récents d'abord) | `PublishDraft[]` |
| POST | `/api/drafts` | Crée un brouillon (body = `PublishDraftPatch`, au minimum `{ type, step }`) | `PublishDraft` |
| GET | `/api/drafts/:id` | Reprise d'un brouillon (`404` si publié/supprimé) | `PublishDraft` |
| PATCH | `/api/drafts/:id` | **Sauvegarde automatique** (~1,2 s après chaque modification). Remplace les champs envoyés ; **aucune validation métier bloquante** (un brouillon peut être incomplet) | `PublishDraft` |
| DELETE | `/api/drafts/:id` | Supprime le brouillon | — |
| POST | `/api/uploads` | multipart `file` (JPG/PNG/WebP ≤ 10 Mo) + `purpose=publication_media`. Upload immédiat ; le brouillon ne garde que `{ id, url }` | `UploadedMedia` |
| POST | `/api/drafts/:id/publish` | Validation complète + publication ; supprime le brouillon en cas de succès | `PublishResult` |

### Publication

`PublishResult` : `{ "status": "published" | "pending_review" | "pending_kyc", "universe": "immobilier", "itemId": "l-123" }`

- `published` : en ligne (le front redirige vers `/annonces/:itemId` pour l'immobilier).
- `pending_kyc` : compte à certifier (M07) avant mise en ligne — ex. agent sans KYC renforcé. Le front propose « Faire certifier mon compte ».
- `pending_review` : file de modération (M16).
- Un même utilisateur peut publier plusieurs biens dans plusieurs lieux (pas de limite côté front ; quotas éventuels administrables).
- La publication immobilière attribue le rôle `owner` ou `agent` à l'utilisateur s'il ne l'a pas.

**Erreurs de validation** : `422` + `code: "VALIDATION_ERROR"` +

```json
{ "success": false, "message": "Certains champs sont à corriger.", "errors": [{ "field": "price", "message": "Indiquez le prix." }, { "field": "media", "message": "Ajoutez au moins une photo." }] }
```

`field` = nom du champ du bloc de l'univers (`title`, `price`, `agencyName`…), `media` ou `type`. Le front ramène l'utilisateur à la bonne étape et affiche le message sous le champ.

Règles à revalider côté serveur (miroir de `src/views/publish/schemas.ts`) :

| Univers | Règles |
|---------|--------|
| immobilier | `publisherRole` requis ; `agencyName` requis si agent ; `transaction`, `propertyKind`, `city`, `price` > 0, `priceUnit` requis ; `title` 10–90 car. ; `description` 30–3000 ; `bedrooms` requis sauf terrain/bureau/commerce ; `surface` requise pour un terrain ; **1 à 10 photos** |
| personnel | `job`, `city`, `experienceYears` (0–60), `availability` requis ; `title` 10–90 ; `summary` 30–1500 ; `salaryMin ≤ salaryMax` ; ≤ 10 `skills` ; ≤ 1 photo |
| services | `category`, `structure`, `city` requis ; `businessName` si entreprise ; `title` 10–90 ; `description` 30–2000 ; ≤ 6 photos |

**Textes publiés** : masquer téléphones, e-mails et liens dans `title`/`description`/`summary` (même règle que la messagerie) — le contact passe par la messagerie et le contact direct payant.

### Simulation en mode mock

Les brouillons sont gardés dans le `localStorage` du navigateur (démo). Publier en tant qu'**agent** renvoie `pending_kyc` ; propriétaire, candidat et prestataire sont publiés et ajoutés au feed de démo.

---

## Étape 6 — Certification KYC + abonnements Propriétaire / Agent (Modules 07 & 08) ✅ front prêt

### Certification (M07) — types `src/types/kyc.ts`, règles `src/lib/kycRequirements.ts`

Toutes les routes sont **auth** et ne portent que sur le dossier de l'utilisateur connecté.

```json
{
  "profile": "owner",
  "status": "en_revue",
  "documents": [
    { "id": "kd-1", "type": "identity", "side": "recto", "fileName": "cni-recto.jpg", "uploadedAt": "…", "status": "uploaded" },
    { "id": "kd-2", "type": "identity", "side": "verso", "fileName": "cni-verso.jpg", "uploadedAt": "…", "status": "uploaded" },
    { "id": "kd-3", "type": "property_proof", "fileName": "titre.pdf", "uploadedAt": "…", "status": "rejected", "rejectionReason": "Pièce illisible" }
  ],
  "locations": [{ "city": "Yaoundé", "district": "Bastos", "latitude": 3.89, "longitude": 11.51 }],
  "submittedAt": "…", "reviewedAt": "…", "expiresAt": "…", "rejectionReason": "…",
  "badgeActive": false,
  "history": [{ "status": "a_completer", "at": "…" }, { "status": "soumis", "at": "…" }, { "status": "rejete", "at": "…", "note": "Pièce illisible" }]
}
```

- `status` : `a_completer | soumis | en_revue | verifie | rejete | expire`. Modifiable seulement en `a_completer`, `rejete`, `expire` (sinon `409` + `code: "KYC_LOCKED"`).
- **Documents : jamais d'URL**, ni dans cette API ni ailleurs côté public. Stockage **chiffré**, accès réservé aux vérificateurs (back-office M16 avec historique et motifs).
- `badgeActive` : badge public « Identité vérifiée » réellement affiché (ex. `verifie` + abonnement Propriétaire/Agent actif — règle métier serveur). C'est ce qui alimente `publisher.verified` dans le feed et les fiches.
- `history[].note` : motif lisible par l'utilisateur (rejet…).

Pièces requises :

| Profil | Exigences |
|--------|-----------|
| `owner` | `identity` recto **et** verso · `property_proof` · ≥ 1 `location` |
| `agent` | `identity` recto **et** verso · `professional_card` **ou** `mandate` · ≥ 1 `location` (biens / lieux) |

Une pièce `rejected` ne compte plus : elle doit être remplacée avant une nouvelle soumission.

| Méthode | Endpoint | Body | `data` |
|---------|----------|------|--------|
| GET | `/api/kyc` | — | `KycDossier` (créé vide si inexistant) |
| PUT | `/api/kyc/profile` | `{ "profile": "owner" \| "agent" }` | `KycDossier` |
| POST | `/api/kyc/documents` | multipart `file` (JPG/PNG/WebP/PDF ≤ 10 Mo), `type`, `side?` (`recto`/`verso` pour `identity`). Remplace la pièce de même type/face | `KycDocument` |
| DELETE | `/api/kyc/documents/:id` | — | `KycDossier` |
| PUT | `/api/kyc/locations` | `{ "locations": KycLocation[] }` (remplace la liste ; `latitude/longitude` facultatifs = point carte) | `KycDossier` |
| POST | `/api/kyc/submit` | — | `KycDossier` (`status: "soumis"`) ; `422` + `errors[{ field, message }]` si incomplet |

Le front rafraîchit le dossier toutes les 5 s tant qu'il est `soumis` / `en_revue`. Notifier l'utilisateur à la décision (vérifié / rejeté + motif).

### Abonnements (M08) — types `src/types/subscription.ts`

`Plan` (administrable, M16) :

```json
{ "code": "oa_pro", "audience": "owner_agent", "name": "Pro", "price": 10000, "period": "month", "durationDays": 30, "recommended": true, "tone": "brand", "rank": 2,
  "features": ["Tout Vérifié", "Mise en avant périodique", "Statistiques avancées", "Priorité dans les résultats"] }
```

Plans attendus pour `owner_agent` : `Vérifié` 5 000 (tone `trust`), `Pro` 10 000 (`brand`, recommandé), `Premium` 15 000 (`perso`). `tone` : `trust | brand | perso | neutral`.
`period` : `month` (affiché « / mois ») ou `pass` (forfait de `durationDays` jours, affiché « Valable N jours »).

| Méthode | Endpoint | Description | `data` |
|---------|----------|-------------|--------|
| GET | `/api/plans?audience=owner_agent` | Public. Aussi `candidate` (M12) et `recruiter` (M13) à l'étape 8 | `Plan[]` triés par `rank` |
| GET | `/api/subscriptions/me` | Auth. Mes abonnements **actifs** | `Subscription[]` |
| POST | `/api/payments/subscription` | Auth. Body `{ planCode, operator, payerPhone, idempotencyKey }` + header `Idempotency-Key`. Même cycle que le déblocage contact | `Payment` (`purpose: "subscription"`, `planCode`) |

`Subscription` : `{ id, planCode, planName, audience, status: "active" | "expired" | "cancelled", startedAt, expiresAt }`.

- Activation **uniquement** au webhook `paid` ; durée 1 mois. Un seul abonnement actif par `audience` : un nouveau plan remplace l'ancien à l'activation (règle de prorata éventuelle côté serveur).
- `GET /payments/:id` sert au suivi (cf. étape 3).
- Le plan payant donne un bonus **borné** au classement (§11) ; toute mise en avant commerciale ⇒ `sponsored: true` sur l'item.

### Simulation en mode mock

Dossier KYC et abonnements gardés dans le `localStorage`. Après soumission : `en_revue` (~5 s) puis `verifie` (~10 s). Un fichier dont le nom contient `flou` entraîne un rejet avec motif. Paiement : `paid` après ~6 s, numéro finissant par `0000` ⇒ échec.

---

## Étape 7 — Avis & réputation (Module 09) ✅ front prêt

Types : `src/types/review.ts`.

### Interactions ouvrant droit à un avis

Un avis n'est possible qu'après une **interaction vérifiable** entre l'utilisateur et le publieur : conversation (au moins un message échangé), contact direct débloqué (`unlock_contact` payé) ou visite planifiée. **Un seul avis actif par interaction.**

```json
{ "id": "int-123", "kind": "conversation", "subject": { "id": "u-nadia", "name": "Nadia L.", "kind": "owner", "verified": true },
  "context": { "universe": "immobilier", "itemId": "l-001", "title": "Appartement moderne à Bastos" }, "at": "…", "reviewId": null }
```

`kind` : `conversation | contact_unlock | visit` · `reviewId` : id de l'avis déjà donné (le front propose alors de le modifier), sinon `null`.

### `Review`

```json
{
  "id": "rv-1", "author": { "id": "u-9", "name": "Paul E.", "avatar": null }, "subjectId": "u-nadia",
  "rating": 4, "comment": "Ponctuel, visite organisée…", "interactionKind": "contact_unlock",
  "context": { "universe": "immobilier", "itemId": "l-001", "title": "…" },
  "createdAt": "…", "updatedAt": "…",
  "reply": { "text": "Merci !", "createdAt": "…" },
  "mine": false, "canReply": false
}
```

- `rating` : entier 1–5 ; `comment` facultatif (≤ 1000 car.) — **masquer téléphones, e-mails, liens** comme en messagerie.
- `mine` / `canReply` : calculés pour l'utilisateur connecté (`canReply` = je suis le publieur évalué et pas encore répondu).
- `author.name` : prénom + initiale (pas de nom complet ni de coordonnées).

### Endpoints

| Méthode | Endpoint | Description | `data` |
|---------|----------|-------------|--------|
| GET | `/api/users/:id/reviews?rating=&cursor=&limit=` | Public (token optionnel). Avis sur un publieur, plus récents d'abord ; `rating` filtre | `ReviewPage` |
| GET | `/api/me/reviews/received?rating=&cursor=&limit=` | Auth. Avis reçus (même forme) | `ReviewPage` |
| GET | `/api/reviews/eligibility?subjectId=` | Auth. Mes interactions notables (toutes si `subjectId` absent) | `ReviewableInteraction[]` |
| POST | `/api/reviews` | Auth. `{ interactionId, rating, comment? }` · `403 NOT_ELIGIBLE` · `409 ALREADY_REVIEWED` | `Review` |
| PATCH | `/api/reviews/:id` | Auth, auteur. `{ rating, comment? }` (renseigne `updatedAt`) | `Review` |
| POST | `/api/reviews/:id/reply` | Auth, publieur évalué. `{ text }` (≤ 500 car.), **une seule réponse** · `409 ALREADY_REPLIED` | `Review` |

`ReviewPage` = `CursorPage<Review>` + :

```json
{ "subject": { "id": "u-nadia", "name": "Nadia L.", "kind": "owner", "verified": true },
  "summary": { "average": 4.7, "count": 26, "distribution": { "1": 0, "2": 0, "3": 0, "4": 8, "5": 18 } } }
```

`summary` porte sur **tous** les avis du publieur (indépendamment du filtre `rating`). `average` arrondie à 0,1 ; c'est aussi la source de `publisher.rating` / `publisher.reviewsCount` dans le feed et les fiches.

### Règles

- **Pas de suppression par l'auteur** : seul un modérateur peut retirer un avis, avec **audit trail** (qui, quand, motif) — back-office M16.
- Signalement d'un avis : `POST /api/reports` avec `targetType: "review"` (cf. étape 3).
- Un avis sur un publieur ne modifie pas le classement au-delà de la pondération « Confiance » (§11).

### Simulation en mode mock

Les publieurs de démo ont des avis générés cohérents avec leur note. Les interactions notables sont les conversations de démo et les contacts débloqués. Avis donnés et réponses gardés dans le `localStorage`.

---

## Étape 8 — Placement du personnel (Modules 10 à 13) ✅ front prêt

Types : `src/types/candidate.ts` (+ `CandidateFeedItem` dans `feed.ts`).

### Liste des candidats (M10) — `GET /api/search?universe=personnel&…`

Même endpoint que l'étape 2. Ajouts :

| Param | Description |
|-------|-------------|
| `salaryMax` | budget recruteur : profils dont `salaryMin` ≤ ce montant (salaire visé = attente, jamais une garantie) |
| `sort=pertinence` | **pertinence puis niveau de visibilité** (Premium > Standard > Gratuit, bonus borné) |
| `sort=pertinence_pure` | **pertinence seule**, sans aucun effet des plans (critère M13 : le recruteur peut trier indépendamment du plan) |

`CandidateFeedItem` gagne `salaryMin?`, `salaryMax?` (FCFA/mois). Les profils **gratuits restent trouvables** (jamais exclus par le plan).
Libellé du niveau côté front : `premium` → « Premium », `standard` → « Standard », `gratuit` → « Basique ».

### Profil candidat (M11) — `GET /api/candidates/:id` — public (token optionnel)

`CandidateDetail` = `CandidateFeedItem` +

```json
{
  "summary": "Chauffeure expérimentée…", "skills": ["Conduite urbaine", "Ponctuelle"], "training": "Conduite défensive",
  "license": "B - valide", "references": { "total": 2, "verified": 2 },
  "badges": { "identityVerified": true, "trained": true },
  "viewerAccess": { "canContact": false, "canShortlist": false, "shortlisted": false, "reason": "no_plan" },
  "viewerIsOwner": false
}
```

- **Jamais** : téléphone, e-mail, adresse, âge, situation familiale, religion, ethnie, santé, documents. Badges « Formé » et « Identité vérifiée » uniquement sur preuve contrôlée.
- `viewerAccess.reason` : `login | no_plan | plan_too_low` (absent si accès ouvert). Le contact passe par `POST /conversations/open` (étape 4) — le serveur doit **refuser l'ouverture d'une conversation vers un candidat** si le recruteur n'a pas le droit `contact` (`403 PLAN_REQUIRED`), sauf si le candidat a lui-même initié l'échange.
- `404` si profil inconnu / masqué.

`GET /api/me/candidate-profile` — auth : mon profil candidat (`CandidateFeedItem`) ou `null`.

### Abonnements candidats (M12) et forfaits recruteurs (M13)

Mêmes endpoints que l'étape 6 : `GET /plans?audience=candidate|recruiter`, `GET /subscriptions/me`, `POST /payments/subscription`.

| Audience | Plans attendus (`code` · prix · `period`) |
|----------|-------------------------------------------|
| `candidate` | `cand_gratuit` 0 (rank 0, sans paiement) · `cand_standard` 500 `pass` 30 j · `cand_premium` 1 000 `pass` 30 j (recommandé) |
| `recruiter` | `rec_essentiel` 5 000 · `rec_forme` 8 000 (recommandé) · `rec_premium` 10 000 — `pass` 30 j |

- Plan `price: 0` : jamais de paiement (`422 FREE_PLAN` si demandé) ; c'est l'état par défaut sans abonnement actif.
- Plan candidat activé ⇒ `plan` du profil mis à jour (classement), **sans** changer compétences ni badges.
- Forfait recruteur : **droits révoqués à l'expiration** ; historique et factures dans Mon compte › Paiements (étape 10).
- **À confirmer par le métier** : la durée des plans candidats et forfaits recruteurs (30 jours par défaut ici ; le dossier ne la précise pas).

### Accès recruteur et shortlist — auth

`GET /api/recruiter/access` → `RecruiterAccess` :

```json
{ "planCode": "rec_forme", "planName": "Formé", "expiresAt": "…", "shortlistCount": 3,
  "rights": { "contact": true, "advancedFilters": true, "shortlist": true, "trainedPriority": true,
              "exportShortlist": true, "assistedPreselection": false, "prioritySupport": false } }
```

| Droit | Essentiel | Formé | Premium |
|-------|:---:|:---:|:---:|
| `contact`, `advancedFilters`, `shortlist` | ✓ | ✓ | ✓ |
| `trainedPriority`, `exportShortlist` | | ✓ | ✓ |
| `assistedPreselection`, `prioritySupport` | | | ✓ |

Sans forfait : `planCode: null` et tous les droits à `false`. Droits administrables.

| Méthode | Endpoint | Description | `data` |
|---------|----------|-------------|--------|
| GET | `/api/recruiter/shortlist` | Droit `shortlist`, sinon `403 PLAN_REQUIRED` | `ShortlistEntry[]` (`{ candidate: CandidateFeedItem, addedAt }`) |
| POST | `/api/recruiter/shortlist` | `{ candidateId }` — idempotent | `ShortlistEntry[]` |
| DELETE | `/api/recruiter/shortlist/:candidateId` | | `ShortlistEntry[]` |
| GET | `/api/recruiter/shortlist/export` | Droit `exportShortlist`. **Fichier CSV** (`text/csv`, UTF-8 avec BOM, séparateur `;`) : nom, métier, ville, expérience, disponibilité, formé, lien profil — **aucune coordonnée** | fichier |

### Simulation en mode mock

5 candidats de démo (chauffeurs, ménagère, cuisinière, auxiliaire de vie). Souscrire un forfait recruteur ouvre contact/shortlist/export selon le plan. Shortlist et abonnements gardés dans le `localStorage`.

---

## Étape 9 — Autres services (Module 14) ✅ front prêt

Types : `src/types/services.ts` (+ `ServiceFeedItem` dans `feed.ts`).

### `GET /api/services/categories` — public

Catégories **actives** (activables en back-office M16), dans l'ordre d'affichage, avec le nombre de prestataires publiés :

```json
[
  { "code": "demenagement", "label": "Déménagement", "description": "Manutention & transport", "initials": "DM", "tone": "brand", "regulated": false, "providerCount": 12 },
  { "code": "professionnels_habilites", "label": "Professionnels habilités", "description": "Notaires, géomètres…", "initials": "PR", "tone": "brand", "regulated": true, "providerCount": 4 }
]
```

- Catégories initiales : `demenagement`, `plomberie`, `electricite`, `peinture`, `menage`, `gardiennage`, `travaux`, `professionnels_habilites`.
- `tone` : `brand | service | caution | perso | trust | navy | danger` (couleur de la pastille).
- `regulated: true` ⇒ le front affiche l'avertissement « orientation, sans conseil juridique LUDRA ».
- Les codes doivent rester cohérents avec `serviceCategories` de `GET /search/options`. Une catégorie désactivée disparaît des deux.

### Prestataires d'une catégorie

`GET /api/search?universe=services&category=<code>&city=&sort=` (étape 2) — tris utilisés : `pertinence`, `recent`, `prix_asc` (sur `priceFrom`).

### `GET /api/services/providers/:id` — public (token optionnel)

`ServiceProviderDetail` = `ServiceFeedItem` +

```json
{
  "description": "Office notarial. Vérification de titres fonciers…",
  "structure": "entreprise", "businessName": "Me Ngo Bassa",
  "zones": ["Yaoundé"],
  "badges": { "identityVerified": true, "regulatedVerified": true },
  "regulatedProfession": "Notaire",
  "viewerIsOwner": false
}
```

- `regulatedVerified` : habilitation professionnelle **contrôlée sur justificatif** (numéro d'ordre, agrément…) — badge « Notaire habilité ». Sinon le front affiche « Habilitation non vérifiée ».
- Pas de coordonnées : le contact se fait par la messagerie (`POST /conversations/open` avec `itemId` = id du prestataire, bouton « Demander un devis »). Avis : `GET /users/:publisherId/reviews` (étape 7). Signalement : `POST /reports` `targetType: "user"`.
- `404` si inconnu.

### Règles (critères M14)

- Professionnels réglementés **clairement identifiés** (`regulated` + `regulatedVerified` + `regulatedProfession`).
- **Aucune confusion avec un service garanti par LUDRA** : aucun champ ne doit laisser entendre une garantie ; le front affiche systématiquement « LUDRA met en relation mais ne garantit pas le service ».
- Publication d'un service : wizard de l'étape 5 (`type: "services"`).

---

## Étape 10 — Mon compte / favoris / paiements (Module 15) ✅ front prêt

Types : `src/types/account.ts`. Toutes les routes sont **auth** et ne portent que sur l'utilisateur connecté (« chaque donnée synchronisée sur le compte »).

### Tableau de bord — `GET /api/me/overview`

```json
{
  "user": { "id": "u-1", "name": "John K.", "avatar": null, "city": "Yaoundé", "status": "active", "memberSince": "…" },
  "items": { "total": 12, "active": 4, "archived": 8, "pending": 0 },
  "favorites": 37,
  "messages": { "total": 8, "unread": 3 },
  "payments": { "totalSpent": 24500, "count": 6 },
  "kycStatus": "a_completer",
  "subscriptions": [],
  "pendingReviews": 2
}
```

`user.status` : `active | restricted | deletion_requested`. `subscriptions` = abonnements actifs (forme étape 6).

### Mes publications

| Méthode | Endpoint | Description | `data` |
|---------|----------|-------------|--------|
| GET | `/api/me/items?status=` | Annonces, profil candidat et services de l'utilisateur ; `status` facultatif | `MyItem[]` |
| PATCH | `/api/me/items/:id/status` | `{ status: "active" \| "paused" \| "rented" \| "archived" }` — `rented` réservé à l'immobilier ; `409 INVALID_TRANSITION` | `MyItem` |
| POST | `/api/me/items/:id/edit` | Crée un **brouillon pré-rempli** (`PublishDraft` avec `sourceItemId`, `step: 2`, médias existants) | `PublishDraft` |

`MyItem` : `{ item: FeedItem, status, stats: { views, contacts, favorites }, updatedAt }`.
`status` : `active | paused | rented | archived | pending_review | pending_kyc`. **Seules les publications `active` apparaissent** dans le feed et la recherche.
Publier un brouillon ayant `sourceItemId` (`POST /drafts/:id/publish`, étape 5) **met à jour la publication existante** (même `itemId`) au lieu d'en créer une.

### Favoris (collections optionnelles)

| Méthode | Endpoint | Description | `data` |
|---------|----------|-------------|--------|
| GET | `/api/saved?universe=&collectionId=&cursor=&limit=` | `collectionId=none` : favoris sans collection ; absent : tous | `CursorPage<SavedItem>` |
| GET | `/api/saved/collections` | | `SavedCollection[]` (`{ id, name, count }`) |
| POST | `/api/saved/collections` | `{ name }` (≤ 40 car.) — `409 DUPLICATE` | `SavedCollection` |
| PATCH | `/api/saved/collections/:id` | `{ name }` | `SavedCollection` |
| DELETE | `/api/saved/collections/:id` | Les favoris sont conservés, `collectionId` → `null` | — |
| PATCH | `/api/saved/:itemId` | `{ collectionId: string \| null }` | — |

`SavedItem` : `{ item: FeedItem (isFavorite: true), savedAt, collectionId }`. Retrait : `POST /saved/toggle` (étape 1). `isFavorite` doit être exact dans **toutes** les réponses (feed, recherche, fiche) pour l'utilisateur connecté.

### Paiements, reçus, déblocages

| Méthode | Endpoint | `data` |
|---------|----------|--------|
| GET | `/api/me/payments` | `PaymentRecord[]` (plus récents d'abord, tous statuts) |
| GET | `/api/me/payments/:id` | `PaymentRecord` (page de reçu imprimable côté front) |
| GET | `/api/me/unlocks` | `ContactUnlock[]` : `{ listingId, title, publisherName, unlockedAt }` |

`PaymentRecord` = `Payment` (étape 3) + `label` (ex. « Déblocage contact — Appartement moderne à Bastos », « Abonnement Pro — Propriétaire / Agent ») + `receiptNumber` (paiements `paid` uniquement, numérotation unique et séquentielle) + `listing?: { id, title }` + `plan?: { code, name }`. Les reçus sont conservés même après suppression du compte (obligation légale).

### Profil et sécurité

Endpoints **V1 existants réutilisés tels quels** : `GET /auth/me`, `PUT /users/profile` `{ name, phone, city, whatsapp }`, `POST /users/profile/avatar` (multipart `avatar`), `POST /users/request-deletion`, `POST /users/cancel-deletion`. Le front attend dans `GET /auth/me` : `id, name, email, phone, whatsapp, city, avatar, deletionRequestedAt`.

Nouveaux :

| Méthode | Endpoint | Body | `data` |
|---------|----------|------|--------|
| GET / PUT | `/api/me/preferences` | `NotificationPreferences` | `NotificationPreferences` |
| POST | `/api/me/password` | `{ currentPassword, newPassword }` (≥ 8 car.) — `403 WRONG_PASSWORD` | `{ changed: true }` |
| POST | `/api/me/logout-all` | — révoque tous les refresh tokens | `{ revoked: true }` |

`NotificationPreferences` : `{ newMessages, searchAlerts, reviews, payments, marketing, channels: { email, sms, push } }` (booléens).

Téléphone / WhatsApp envoyés au format `+2376XXXXXXXX`, **jamais exposés publiquement** (seulement après déblocage payé, étape 3).

### Simulation en mode mock

L'utilisateur de démo possède 2 annonces (1 en ligne, 1 archivée). Favoris, collections, statuts, paiements, déblocages, profil et préférences sont gardés dans le `localStorage`. Mot de passe actuel « mauvais » ⇒ `WRONG_PASSWORD`.

---

## Étape 11 — Back-office & modération (Module 16) ✅ front prêt

Types : `src/types/admin.ts`. Permissions : `src/lib/adminPermissions.ts`.

### Rôles et permissions (RBAC §6.1)

Modèle **existant conservé** : rôle `proprietaire` (compte principal) = tous les droits ; rôle `admin` = liste `adminPermissions` (déjà dans le JWT / `GET /auth/me`). Permissions V1 conservées (`manage_users`, `add_admin`, `manage_properties`, `add_property`) + nouvelles :

| Permission | Accès |
|------------|-------|
| `manage_properties` | Modération des annonces (`/admin/listings*`) |
| `review_kyc` | Dossiers KYC, consultation des pièces, preuves Formé / habilitations |
| `moderate_reviews` | Avis signalés |
| `handle_reports` | Signalements |
| `view_payments` / `manage_payments` | Consultation / rapprochement des paiements |
| `manage_settings` | Prix, plans, classement, catégories |
| `manage_users` / `add_admin` | Utilisateurs / rôles et permissions |
| `add_property` | Publier pour le compte d'un utilisateur |
| `view_audit` | Journal d'audit |

**Toutes** les routes `/api/admin/*` : `authenticate` + rôle `admin|proprietaire` + `requirePermission(...)` (middleware V1 existant). Le front masque les entrées non autorisées mais le serveur doit répondre `403`.

### Journal d'audit (critère « actions sensibles journalisées »)

Chaque décision ci-dessous **doit** créer une entrée `AuditEntry`, côté serveur, dans la même transaction :

```json
{ "id": "au-1", "at": "…", "actor": { "id": "adm-2", "name": "Grace M.", "role": "admin" },
  "action": "kyc.reject", "targetType": "user", "targetId": "u-188", "targetLabel": "Agence Horizon",
  "reason": "CNI expirée…", "changes": [{ "field": "status", "from": "en_revue", "to": "rejete" }] }
```

Actions : `kyc.start_review|approve|reject`, `document.view`, `listing.approve|reject|suspend|restore|sponsor|unsponsor`, `review.keep|remove`, `report.dismiss|warn_user|remove_content|suspend_user`, `payment.reconcile`, `proof.approve|reject`, `settings.update` (avec `changes` ancien → nouveau), `user.update|suspend|restore`. Entrées **non modifiables, non supprimables**.

`GET /api/admin/audit?q=&action=<préfixe>&cursor=` (`view_audit`) → `CursorPage<AuditEntry>` (30 par page, plus récentes d'abord).

### Décisions

Toutes les décisions : `POST …/decision` avec `{ decision, reason? }`. **Motif obligatoire** (≥ 5 car.) pour toute décision négative (rejet, suspension, retrait, avertissement) ⇒ sinon `422`. Le motif est communiqué à l'utilisateur concerné (notification) et journalisé.

### Endpoints

| Méthode | Endpoint | Permission | `data` |
|---------|----------|-----------|--------|
| GET | `/api/admin/stats` | admin | `AdminStats` |
| GET | `/api/admin/queue?kind=` | admin (filtrée par permissions) | `QueueItem[]` (priorité élevée d'abord) |
| GET | `/api/admin/kyc?status=` | `review_kyc` | `AdminKycSummary[]` |
| GET | `/api/admin/kyc/:userId` | `review_kyc` | `AdminKycDossier` |
| GET | `/api/admin/kyc/:userId/documents/:docId/view` | `review_kyc` | `DocumentView` `{ url, mimeType, expiresAt }` — **URL signée ≤ 5 min**, consultation journalisée (`document.view`) |
| POST | `/api/admin/kyc/:userId/decision` | `review_kyc` | `{ decision: start_review\|approve\|reject, reason?, rejectedDocumentIds? }` → `AdminKycDossier` |
| GET | `/api/admin/listings?status=&q=&cursor=` | `manage_properties` | `CursorPage<AdminListing>` |
| POST | `/api/admin/listings/:id/decision` | `manage_properties` | `{ decision: approve\|reject\|suspend\|restore\|sponsor\|unsponsor, reason? }` → `AdminListing` |
| GET | `/api/admin/reviews?reported=true` | `moderate_reviews` | `AdminReview[]` |
| POST | `/api/admin/reviews/:id/decision` | `moderate_reviews` | `{ decision: keep\|remove, reason? }` |
| GET | `/api/admin/reports?status=open` | `handle_reports` | `AdminReport[]` |
| POST | `/api/admin/reports/:id/decision` | `handle_reports` | `{ decision: dismiss\|warn_user\|remove_content\|suspend_user, reason? }` |
| GET | `/api/admin/payments?status=&purpose=` | `view_payments` | `AdminPayment[]` (= `PaymentRecord` + `userName`, `webhook: received\|missing\|invalid_signature`, `operatorReference`) |
| POST | `/api/admin/payments/:id/reconcile` | `manage_payments` | interroge l'API opérateur pour un paiement `pending` sans webhook → `AdminPayment` ; `409` sinon |
| GET | `/api/admin/proofs?status=` | `review_kyc` | `AdminProof[]` (`kind: training\|habilitation`) |
| POST | `/api/admin/proofs/:id/decision` | `review_kyc` | `{ decision: approve\|reject, reason? }` — `approve` active le badge (`trained` / `regulatedVerified`) |
| GET / PUT | `/api/admin/settings` | `manage_settings` | `AdminSettings` |
| GET | `/api/admin/users?q=&role=&cursor=` | `manage_users` | `CursorPage<AdminUser>` |
| PATCH | `/api/admin/users/:id` | `manage_users` (rôle/permissions : `add_admin`) | `{ role?, adminPermissions?, isActive?, reason? }` → `AdminUser` ; compte `proprietaire` non modifiable (`403`) |

Effets attendus : annonce `suspended`/`rejected` ⇒ invisible du feed, de la recherche et des fiches publiques ; `approve` ⇒ publiée ; `suspend_user` ⇒ compte désactivé (`403 ACCOUNT_DISABLED` déjà géré par le front) ; avis `remove` ⇒ retiré des listes et de la moyenne.

### Paramètres (critère « aucun prix critique codé en dur côté front »)

```json
{
  "contactUnlock": { "min": 250, "max": 500, "price": 500 },
  "plans": [{ "code": "oa_pro", "audience": "owner_agent", "name": "Pro", "price": 10000, "period": "month", "durationDays": 30,
              "features": ["…"], "recommended": true, "tone": "brand", "rank": 2, "active": true }],
  "ranking": { "organicQuotaPercent": 60, "maxPlanBoostPercent": 20 },
  "serviceCategories": [{ "code": "plomberie", "label": "Plomberie", "…": "…", "active": true }]
}
```

Validation serveur : `contactUnlock.price` dans `[min, max]` (250–500 par défaut) ; prix ≥ 0 ; `organicQuotaPercent` ≥ 50 ; un seul `recommended` par audience. Les valeurs sont **immédiatement** reflétées par `GET /plans`, `listing.contact.price`, `GET /services/categories`, `GET /search/options` et le classement (§11). `PUT` journalise chaque champ modifié.

### Publication pour le compte d'un utilisateur (`add_property`)

`PublishDraft.onBehalfOf = { userId, name }` (posé à la création du brouillon). À la publication, le serveur vérifie la permission `add_property` et publie avec `userId` comme publieur ; action journalisée.

### Simulation en mode mock

Rôle de session `proprietaire` ⇒ tout ; `admin` ⇒ selon `adminPermissions`. Dossiers KYC, annonce en attente, avis/signalements, paiements anormaux et preuves de démo. Les paramètres modifiés ici changent réellement les prix affichés côté site (plans, déblocage contact) et l'activation des catégories. Tout est gardé dans le `localStorage`.

---

## Étape 12 — Notifications, pages secondaires, nettoyage ✅ front prêt

### Centre de notifications — auth

Remplace les notifications V1 au même chemin — ✅ implémenté dans le backend.

| Méthode | Endpoint | `data` |
|---------|----------|--------|
| GET | `/api/notifications?cursor=&limit=` | `NotificationPage` = `CursorPage<AppNotification>` + `unread` |
| POST | `/api/notifications/:id/read` | — |
| POST | `/api/notifications/read-all` | — |

```json
{ "id": "n-2", "kind": "message", "title": "Nadia L. vous a répondu", "body": "« Oui, je peux… »", "href": "/messages/cv-1", "createdAt": "…", "read": false }
```

`kind` : `message | search_alert | review | kyc | payment | listing | subscription | system`. `href` = chemin interne du front (routes : `docs/V2.1_ROADMAP.md`).
Événements à émettre (selon `NotificationPreferences`, étape 10) : nouveau message, nouvelles offres d'une recherche sauvegardée avec alerte, avis reçu / réponse, décision KYC (avec motif), paiement confirmé / échoué, décision de modération (avec motif), expiration proche d'un plan.
`GET /me/counters` → `unreadNotifications` = ce même compteur.

### Support — endpoint V1 réutilisé

`POST /contacts/general` (public) `{ name, email, subject, message }` — `subject` : `info | annonce | paiement | compte | probleme | autre` (nouvelles valeurs `paiement`, `compte`).

### Routes V1 — état du backend (2026-10-15)

**Supprimées du backend** (plus utilisées par le front) : `/properties*`, `/favorites*`, `/visits*`, `/landlord/*`, `/contacts` (demandes de contact : `POST /`, `GET /`, `GET /:id`, `PATCH /:id/read`), `/users/become-landlord`, `PUT /users/change-password` (remplacé par `POST /me/password`), `GET /users/:id`, et toutes les anciennes routes `/admin/*` (création / suppression d'utilisateur, rôle, statut, annonces, logs, filtres).

**Remplacées au même chemin par la version V2.1** (déjà implémentées dans `backend-ludra`) :

| Endpoint | Fichier backend |
|----------|-----------------|
| `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all` | `controllers/notifications.controller.js` — lit aussi les anciens documents V1 (`type`/`message`/`isRead` → `kind`/`body`/`read`) |
| `GET /admin/stats` | `controllers/admin.controller.js` — `users`, `usersNew7d` calculés ; les autres compteurs restent à `0` jusqu'à la création des collections V2.1 (KYC, annonces, signalements, preuves, paiements) |
| `GET /admin/users`, `PATCH /admin/users/:id` | `controllers/admin.controller.js` — RBAC, motif obligatoire pour une suspension, journal `auditLog` (`utils/audit.js`) |

**Données Firestore** : `adminLogs` migrée vers `auditLog` (22 entrées, script `backend-ludra/scripts/migrate-adminlogs-to-auditlog.js`). `properties` (61 annonces), `contacts` (12) et `visits` (1) sont **conservées** : à migrer vers les collections V2.1 quand elles seront définies, ne pas les supprimer avant.

**Conservées telles quelles** : `/auth/*`, `PUT /users/profile`, `POST /users/profile/avatar`, `POST /users/request-deletion`, `POST /users/cancel-deletion`, `POST /contacts/general`.

Utilitaires backend disponibles pour les prochains endpoints : `utils/pagination.js` (`cursorPage` → `CursorPage<T>`), `utils/audit.js` (`createAuditEntry` → `AuditEntry`), `utils/notifications.js` (`createNotification` / `notifierTousLesAdmins` au format `AppNotification`).

---

## Récapitulatif

Les 16 modules du dossier V2.1 sont couverts côté front. Pour brancher l'API : `NEXT_PUBLIC_USE_MOCKS=false` (bascule globale). Pour une mise en service progressive, un service peut être branché seul en remplaçant son `withMock(mock, réel)` par l'appel réel (`src/services/*.service.ts`).
