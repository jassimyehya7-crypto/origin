# Re-audit UX P0 — client Épicerie Club
Date: 2026-09-13
Auditeur: UX Épuré
Réf: AUDIT-UX-POST.md (baseline 5,5/10)

**Méthode :** relecture code actuel (`OfferCard.tsx`, `page.tsx`, `OfferDetailClient.tsx` + `offre/[id]/page.tsx`, `utils.formatWalkDistance`). Screenshots `docs/audit-shots/` (21:44) et `preview-*.png` = **pré-fix** (hero éditorial, carton prix, CTA jaune) — **non représentatifs**. Serveur `next dev` présent mais instable (500 / missing error components) au moment du recheck → verdict **basé sur le code**.

## Nouveau score
**7,5/10 — Pass**

P0 structure corrigés. Les P1 (pollution Profil / QR, heure retrait réservations) et polish P2 empêchent 8–9.

## P0 un par un

### 1. OfferCard hiérarchie
**Statut : OK**

Preuve `src/components/OfferCard.tsx` :
- Titre display (`font-display text-[1.65rem]`) en tête.
- Prix / `-XX%` en meta `text-sm` sous le titre (`priceMeta`, `text-ec-ink` + struck) — **plus** de display rouge rival.
- Distance utile via `formatWalkDistance` (bleu `text-ec-blue` + adresse) **avant** l’heure.
- Heure seule : `Jusqu'à {formatTime(...)}`.
- Stock discret seul : `Encore {quantityLeft}` (badge image stock bas **supprimé**).
- Pastille **Réserver** en bas, hors du `Link` détail.

Reste mineur : nom commerce (`text-xs`) intercalé entre prix et distance — identité magasin, pas un retour à la hiérarchie prix-first.

### 2. Vérité CTA Réserver
**Statut : OK**

Preuve :
- `OfferCard.tsx` : corps carte → `detailHref` `/offre/[id]` ; CTA séparé → `reserveHref` `/offre/[id]?reserver=1`.
- `offre/[id]/page.tsx` : `openReserve = searchParams?.reserver === "1"`.
- `OfferDetailClient.tsx` : `useEffect` scroll + ring sur `#reserver` / bloc qty quand `openReserve`.

Conforme au brief (engager la résa **ou** ouvrir la fiche sur le bloc résa). Pas de one-tap API depuis la carte — acceptable : qty + sticky restent sur la fiche.

### 3. Feed + fiche
**Statut : OK**

**Feed** `src/app/page.tsx` :
- Hero compressé en **une ligne** : `Aujourd'hui à Villeneuve · N offres`.
- Section **Commerces Villeneuve** `grid-cols-2` **absente** (plus de catalogue sous le feed).
- `ResetDemoButton` hors feed.
- Chips catégories en barre sticky secondaire (chemin autorisé par l’audit initial) — n’empêchent plus un hero plein écran, mais restent au-dessus de la 1ʳᵉ offre (résidu P1/P2, pas fail P0).

**Fiche** `OfferDetailClient.tsx` :
- Tête plate : titre → prix meta → shop → distance → heure → stock (plus de `-XX%` display rouge dominant ni panneau prix/stock).
- Carton décoratif prix/stock **supprimé**.
- Sticky bas : libellé **« Réserver »**, `variant="primary"` (plus « Confirmer la réservation » / jaune confirm).

Reste mineur : qty/message encore dans un `border rounded-[20px]` ; blocs « À propos » + trust encore **avant** la zone qty (idéalement sous fold après l’action).

## Delta vs baseline
| Avant (5,5 Fail partiel) | Après |
|---|---|
| Prix/`-XX%` display rouge avant meta | Prix meta `text-sm` |
| Distance = « Villeneuve » seule | `À Xm` / `À N min` + rue |
| Heure fusionnée au stock | Lignes séparées |
| Pastille Réserver = Link fiche entière | CTA dédié `?reserver=1` → focus bloc résa |
| Hero H1 + sous-titre géoloc | Une ligne compteur |
| Grille commerces 2 cols sous feed | Supprimée du feed |
| Sticky « Confirmer la réservation » + carton prix/stock | Sticky « Réserver » + tête plate |

## Reste bloquant (si quelconque)
**Aucun P0 bloquant.** Pass structurel.

## P1 encore ouverts (rappel court)
- Profil : carte **Espaces métier** → `/pro` / `/fondateur` encore visible côté client.
- `QrClient.tsx` : bandeau « ✓ Scan enregistré » / attribution démo encore exposé.
- Réservations « à venir » : affiche `createdAt`, pas l’heure / validité de retrait.
- (Ex-P1 distance / lignes heure-stock : **traités** avec les P0 — ne plus les recompter ouverts.)
