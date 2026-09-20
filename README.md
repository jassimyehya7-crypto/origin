# OffresLocal

> **AlphaBeta1** (version complète figée, 20 sept. 2026) : dossier [`AlphaBeta1/`](./AlphaBeta1/).
> Ouvrir ce dossier pour retrouver l’interface actuelle (Explorer Google Maps, fiches commerces, réservations).
> La racine ci-dessous est le projet Next.js d’origine.

---

# OffresLocal — MVP démo (Villeneuve VD)

Marketplace locale de **réservation gratuite** + **code de retrait** pour les commerces alimentaires de proximité. Pas de paiement, pas de livraison, pas de chat libre client–commerçant.

## Démarrage

```bash
cd /workspace/offreslocal
npm install
cp .env.local.example .env.local   # si besoin — voir Supabase ci-dessous
npm run seed:supabase              # une fois : shops + offers + résas
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Build de production :

```bash
npm run build && npm start
```

## Surfaces

| Route | Rôle |
|-------|------|
| `/` | **Client** — feed Villeneuve, catégories, offres |
| `/offre/[id]` | Détail offre + quantité + demande de réservation |
| `/confirmation/[id]` | Confirmation + code `EC-xxxx` |
| `/reservations` | Mes réservations (à venir / historique) |
| `/favoris` | Commerces favoris |
| `/profil` | Profil démo + liens Pro / Fondateur |
| `/q/[shopSlug]` | **QR magasin** — enregistre le scan même sans réservation |
| `/pro` | **Commerçant** — KPIs, créer offre, inbox résas |
| `/pro/reservations` | Confirmer / Refuser / Marquer récupéré |
| `/pro/offres` | Liste des offres |
| `/pro/offres/nouvelle` | Création d’offre (&lt; 1 min) |
| `/pro/parametres` | Boutique + pricing |
| `/fondateur` | Pilotage : live clients, KPIs shops, funnel QR, alertes |

## Backend & live (Supabase)

Backend réel : **Supabase** (projet `wjqgcdrqkkihmsfihwtj`).

### Variables d’environnement

Dans `.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Si ces variables sont absentes, l’app bascule automatiquement sur l’adapter **in-memory** (`src/lib/store-local.ts` + SSE `/api/events`).

### Tables

`ec_shops` · `ec_offers` · `ec_reservations` · `ec_scans` · `ec_presence` · `ec_favorites`

Realtime publication activée ; RLS démo ouverte (`anon` / `authenticated` en SELECT/INSERT/UPDATE/DELETE).

### Seed

```bash
npm run seed:supabase
```

Upsert depuis `src/lib/seed.ts` (commerces, offres, réservations, scans, favoris, présence).  
Le bouton **Réinitialiser démo** (`POST /api/demo/reset`) rejoue le même seed côté Supabase.

### Architecture store

| Fichier | Rôle |
|---------|------|
| `src/lib/store.ts` | Façade async — préfère Supabase si env set |
| `src/lib/store-supabase.ts` | CRUD + règles stock sur `ec_*` |
| `src/lib/store-local.ts` | Fallback mémoire + `data/store.json` |
| `src/lib/supabase/client.ts` | Client navigateur |
| `src/lib/supabase/server.ts` | Client serveur |
| `src/hooks/useSupabaseLive.tsx` | Realtime → `router.refresh()` |
| `src/hooks/useLiveRefresh.tsx` | Realtime si env, sinon SSE |

Ops clés : `getShops` / `getOffers` / `getReservations`, `createOffer`, `createReservation`, `updateReservationStatus` (restaure le stock si refus / annulation / no-show), `recordScan`, `heartbeat` / présence, `getFounderStats`.

### Live sync

1. Mutations Pro (publier / confirmer / refuser) → API → Supabase `ec_offers` / `ec_reservations`
2. Realtime pousse le changement aux navigateurs abonnés (`useSupabaseLive`)
3. Le hook appelle `router.refresh()` → pages Client / Pro / Fondateur se mettent à jour sans reload

Démo 2 navigateurs :

1. `npm run dev`
2. Fenêtre A : `/` (client)
3. Fenêtre B : `/pro` (commerçant)
4. Pro : **Publier** → feed client live
5. Client : **Réserver** → inbox Pro
6. Pro : **Confirmer** → statut client live
7. `/fondateur` : compteurs + funnel live (layout mobile empilé)

### API REST

| Méthode | Endpoint | Rôle |
|---------|----------|------|
| GET | `/api/events` | SSE live (fallback local) |
| GET | `/api/shops` | Liste commerces |
| GET/PATCH | `/api/shops/[id]` | Détail / update |
| GET/POST | `/api/offers` | Liste / créer |
| GET/PATCH | `/api/offers/[id]` | Détail (+`?view=1`) / publier |
| GET/POST | `/api/reservations` | Liste / créer (décrémente stock) |
| GET/PATCH | `/api/reservations/[id]` | Statut (restaure stock si refus/annulation/no-show) |
| POST | `/api/scans` | Attribution scan QR |
| GET/POST | `/api/favorites` | Favoris |
| GET/POST | `/api/presence` | Heartbeat clients connectés |
| GET | `/api/founder/stats` | Agrégats fondateur |
| POST | `/api/demo/reset` | **Réinitialiser démo** |

## Règles métier (MVP)

- Zone : **Villeneuve VD**
- Catégories : épicerie, boulangerie, kiosque, crémière, autre local
- Types d’offre : `FLASH` · `PROMO` · `ARRIVAGE` · `DERNIERE_MINUTE`
- Statuts offre : `BROUILLON` → `PUBLIEE` → `EPUISEE` / `EXPIREE` / `SUSPENDUE`
- Statuts résa : `EN_ATTENTE` → `CONFIRMEE` → `RECUPEREE` (+ `REFUSEE`, `ANNULEE`, `NON_RECUPEREE`)
- Stock déduit à la **demande** ; restauré si refus / annulation / non récupérée ; qty 0 → `EPUISEE`
- Validité : jusqu’à la **fermeture du magasin** le jour J
- Notifications client : **placeholders** push + email uniquement
- Pricing UI : **1er mois offert, puis CHF 49.90/mois** — téléphone gratuit, tablette installée en option payante

## Seed démo (~10 commerces)

Da Silva, Vracshop, Macheret, Durgnat, Fontaine, Vis-à-Vis, Favrod, Kiosque Gare, Panier du Léman, Au Croissant Doré.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · lucide-react · **Supabase** (`@supabase/supabase-js`)
