# Audit UX post-restyle — client OffresLocal
Date: 2026-09-13
Auditeur: UX Épuré
Scope: routes client (`/`, `/offre/[id]`, confirmation, réservations, favoris, profil, nav, `q/[shopSlug]`)

> **Note recheck P0 (2026-09-13)** — Les correctifs P0 ont été re-audités dans [`AUDIT-UX-P0-RECHECK.md`](./AUDIT-UX-P0-RECHECK.md).  
> Nouveau score : **7,5/10 — Pass** (P0 hiérarchie carte, vérité CTA, feed/fiche : OK).  
> Ce document reste la baseline pré-fix (5,5/10 Fail partiel) ; ne pas le traiter comme l’état actuel.

## Verdict

Le restyle « Marché Éditorial » (tokens encre / papier / rouge offre / jaune rare) est lisible et le feed vertical d’offres avec un seul verbe **Réserver** sur la carte est la bonne direction. Mais la hiérarchie cible **offre → distance → heure → stock → Réserver** n’est **pas** respectée : le prix / `-XX%` est monté au même poids que le titre, l’heure est collée au stock, la distance reste un libellé « Villeneuve » sans valeur utile, et le feed retient encore l’utilisateur (hero éditorial + chips catégories + grille commerces 2 colonnes) avant / après le scroll d’offres. Fiche offre : CTA sticky présent, mais libellé « Confirmer la réservation », panneau prix/stock en carton, et le faux bouton Réserver de la carte ouvre la fiche (pas la résa). **Score : 5,5 / 10 — Fail partiel** (pass sur scroll cartes + CTA unique de surface ; fail sur hiérarchie, flat feed, vérité du CTA carte).

## Conformité checklist

| Critère | Statut | Preuve (fichier + comportement) |
|---|---|---|
| 1. Hiérarchie carte : offre → distance → heure → stock → Réserver | **KO** | `OfferCard.tsx` : titre → **deal `-XX%` / prix** (display rouge) → shop + pin « Villeneuve » → ligne `qty · aujourd'hui` + pastille Réserver. Distance absente (ville seule). Heure fusionnée au stock. Prix intercalé avant distance/heure. |
| 2. Feed = scroll d’offres, pas catalogue dense | **Partiel** | `page.tsx` : liste `grid gap-5` d’`OfferCard` OK. Mais avant la 1ʳᵉ offre : hero H1, search sticky, chips `cat` ; après : section **Commerces Villeneuve** `grid-cols-2` (grille marketplace). |
| 3. Flat until action | **Partiel** | Carte feed : plat OK. Fiche : cartons imbriqués (`border` prix/stock + bloc quantité/message) dans `OfferDetailClient.tsx`. Profil : `Card` + `bg-ec-soft` imbriqués. Confirmation : surface + encadré code dashed. |
| 4. CTA unique Réserver | **Partiel** | Carte : pastille « Réserver » seule (bon). Mais toute la carte est un `Link` vers `/offre/[id]` — Réserver = « ouvrir la fiche », pas réserver. Fiche : sticky « Confirmer la réservation » (`variant="confirm"`). Empty / shops : « Voir tout » / liens commerces secondaires. |
| 5. Fiche : même hiérarchie en tête, détails sous fold, CTA sticky Réserver | **Partiel** | Sticky bas OK (`fixed bottom-0`). Tête : titre → `-XX%` → shop → adresse+horloge → carton prix/stock → À propos / trust / qty. Pas de distance réelle ; stock trop fort dans le carton ; CTA ≠ « Réserver ». |
| 6. Parcours résa → confirmation : 1 décision / écran, résumé clair | **OK** | Fiche = qty (+ message optionnel) + un CTA. `confirmation/[id]/page.tsx` : statut, code retrait, offre, magasin, heure. Bruit placeholders push/email acceptable en démo. |

## Écran par écran

### Feed `/`

**Ce qui marche**
- Liste verticale d’offres (`grid gap-5`), pas de grille produit dense sur les offres.
- Tokens papier / surface / encre cohérents (`bg-ec-paper`).
- Pied utile : « Réservation gratuite · Pas de paiement en ligne · Retrait en magasin ».
- Empty state avec sortie « Voir tout ».

**Ce qui casse la hiérarchie / le feed**
1. **Hero trop haut** (`Les bons plans du jour` + H1 display 2.5rem + sous-titre géoloc) : retarde la 1ʳᵉ offre hors fold mobile.
2. **Search + chips catégories** au-dessus des offres : filtres qui retiennent avant le scroll (critère 2).
3. **Section « Commerces Villeneuve »** en `grid-cols-2` : catalogue commerces sous le feed — pattern marketplace, pas feed d’offres.
4. **« Réinitialiser démo »** à côté de « Aujourd’hui » : pollution produit / démo dans le parcours client.
5. Double géoloc (header « Villeneuve · près de vous » + ligne sous H1) sans distance métrique.

**Corrections concrètes**
- `page.tsx` : compresser le hero en une ligne (ex. « Aujourd’hui à Villeneuve · N offres ») ; chips en sticky secondaire ou sous la 1ʳᵉ offre (ou masquer tant qu’aucune interaction).
- Déplacer / supprimer la grille commerces du feed (lien profil / favoris / page dédiée, ou liste horizontale très secondaire en bas sans `grid-cols-2`).
- Sortir `ResetDemoButton` vers `/profil` uniquement.
- Première offre visible sans scroll si possible (réduire header sticky + hero).

### Carte offre (OfferCard)

**Ce qui marche**
- Une carte, un lien, un verbe visible « Réserver » (encre) — pas de « Voir » / « Découvrir ».
- Titre offre en display fort (`text-[1.65rem]`).
- Badge type (`OfferTypeBadge`) et état Épuisée clairs.
- Pas de carte dans la carte.

**Ce qui casse la hiérarchie**
1. **Ordre réel** : image/badges → **titre** → **`-XX%` / prix** (rouge display) → shop + « Villeneuve » → **stock · aujourd’hui** + Réserver.  
   Attendu : **offre → distance → heure → stock → Réserver**. Le prix/deal est intercalé et trop fort ; l’heure n’a pas sa ligne ; la distance n’est pas une distance.
2. Stock bas en badge image (`{n} restants`) **et** ligne bas : double signal stock avant l’heure.
3. Pastille « Réserver » non boutonnée : tap = navigation fiche — **promesse CTA mensongère**.
4. Commentaire code « Offer / deal before metadata » assume une hiérarchie prix-first (alignée copy-grille prix→…) **en conflit** avec le brief UX strict offre→distance→heure→stock→Réserver.

**Corrections concrètes** (`OfferCard.tsx`)
- Ordre blocs texte :
  1. Titre offre  
  2. Distance utile (`À X min` / rue) en bleu local, **avant** l’heure  
  3. Heure seule (`Jusqu’à 19h` / `Aujourd’hui`)  
  4. Stock discret (`Encore 6`)  
  5. Pastille **Réserver**
- Prix / `-XX%` : secondaire (même ligne que le titre en petit, ou sous le titre en `text-sm`/`font-bold`, **pas** display rouge rival du titre).
- Un seul endroit pour le stock bas (ligne meta OU badge, pas les deux).
- Soit : CTA Réserver = action réelle (deep-link résa / sheet qty) ; soit garder le tap → fiche mais libeller la pastille **« Détail »** est interdit par le brief — donc **garder Réserver** et faire en sorte que le bouton (pas toute la carte) déclenche la résa, le reste de la carte ouvrant le détail en secondaire.

### Fiche `/offre/[id]`

**Ce qui marche**
- Retour + favori en overlay image.
- CTA **sticky** bas plein largeur (`Button` `full` `size="lg"`).
- Une décision principale : quantité + confirmer.
- Message optionnel correctement secondarisé.

**Ce qui casse**
1. Tête : titre → **`-XX%` display rouge** → shop → puis adresse+horloge en flex — pas offre→distance→heure→stock.
2. Carton `border` prix + stock (`rounded-[20px]`) : stock en `font-extrabold` trop fort, nesting décoratif avant l’action.
3. Sticky label = **« Confirmer la réservation »** (jaune confirm) ≠ « Réserver » du brief ; sur fiche c’est défendable sémantiquement, mais le brief exige sticky **Réserver** — aligner le libellé ou documenter l’exception Produit.
4. Blocs « À propos » + liste trust `ShieldCheck` au milieu du scroll : OK sous fold partiel, mais le carton prix/stock + formulaire qty restent des cartes dans la page.
5. Pas de BottomNav (volontaire) — OK pour focus action.

**Corrections concrètes** (`OfferDetailClient.tsx`)
- En-tête plat, sans carton :
  - H1 offre  
  - Ligne distance (adresse + min si dispo)  
  - Ligne heure (`Aujourd’hui jusqu’à …`)  
  - Ligne stock (`Encore N`)  
  - Prix en meta, pas en panneau
- Déplacer qty + message juste au-dessus du sticky (zone action unique).
- Sticky : libellé **« Réserver »** (ou « Réserver · CHF X ») ; réserver le jaune confirm à l’écran confirmation.
- Description / trust strictement sous le fold (après le premier écran utile).

### Confirmation

**Ce qui marche**
- Une intention claire : « Demande envoyée » / confirmée.
- Code de retrait dominant (mono, dashed).
- Résumé offre + magasin + heure de retrait.
- CTA primaire « Voir mes réservations » + secondaire outline « Retour aux offres ».

**Ce qui casse / bruit**
- Encadré placeholders push/email très visible (`bg-[#eef3ff]`) : pollution démo.
- Carte statut + badge + code = un peu de nesting, acceptable pour un ticket.
- Check icon même en pending (ambre) : OK mais le pictogramme « Check » pour « en attente » est un peu trompeur.

**Corrections**
- Réduire les placeholders en une ligne muted.
- Icône pending = horloge, pas check.

### Réservations / Favoris / Profil / BottomNav

**Réservations** (`reservations/page.tsx`)
- OK : tabs À venir / Historique, carte plate offre + code + statut, empty + lien offres.
- Faible : pas d’heure de retrait sur la ligne (seulement `createdAt`) — pour « à venir », l’heure de retrait manque vs critère parcours.

**Favoris** (`favoris/page.tsx`)
- OK : liste commerces suivis, compteur offres actives.
- Lien vers `/q/[slug]` cohérent avec QR shop.

**Profil** (`profil/page.tsx`)
- **Pollution client** : carte « Espaces métier » → `/pro` et `/fondateur`. Hors scope client visible dans le shell client.
- Nested soft boxes dans Card notifications.
- `ResetDemoButton` ici = bon endroit (mieux que le feed).

**BottomNav** (`BottomNav.tsx`)
- 4 destinations claires, actif jaune Club — conforme usage rare du jaune.
- Pas de 5ᵉ onglet marketplace — bien.

**`q/[shopSlug]`** (parcours client QR)
- Liste `OfferCard` OK.
- Header encre fort OK.
- Ligne « ✓ Scan QR enregistré (attribution démo) » = fuite funnel fondateur sur UI client — à retirer ou masquer hors mode démo.

## Corrections prioritaires (P0 / P1 / P2)

### P0 — Produit / UX structure
1. **Réordonner `OfferCard`** : offre → distance → heure → stock → Réserver ; rétrograder prix/`-XX%` en meta (plus de display rouge rival du titre). Fichier : `src/components/OfferCard.tsx`.
2. **Vérité du CTA carte** : pastille Réserver doit engager la résa (ou ouvrir la fiche directement sur le bloc résa) ; ne plus faire croire à une réservation one-tap qui n’en est pas une.
3. **Feed : tuer le catalogue** — retirer ou reléguer `Commerces Villeneuve` `grid-cols-2` ; compresser hero ; chips ne doivent pas bloquer la 1ʳᵉ offre. Fichier : `src/app/page.tsx`.
4. **Fiche : tête plate alignée** + sticky libellé **Réserver** ; supprimer le carton prix/stock décoratif. Fichier : `OfferDetailClient.tsx`.

### P1 — Copy / Couleurs / Navigation
5. Distance réelle ou au minimum `Rue · Villeneuve` avant l’heure (bleu `#255CFF` pour le pin seulement — déjà partiel).
6. Heure = ligne dédiée (`Jusqu’à HH:MM`), stock = ligne dédiée (`Encore N`) — ne plus fusionner `qty · aujourd'hui`.
7. Sortir liens Pro / Fondateur du profil client (ou derrière un geste démo caché).
8. Retirer « Scan QR enregistré » de `QrClient.tsx` côté client visible.
9. Réservations « à venir » : afficher heure / validité de retrait, pas seulement `createdAt`.

### P2 — Polish
10. Reset démo uniquement profil (déjà partiel — retirer du feed).
11. Confirmation : icône pending ≠ check ; placeholders muted.
12. Search placeholder plus court (`Produit ou commerce`) — alignement copy-grille.
13. Un seul signal stock bas (badge image **ou** meta).

## Hors scope

Surfaces **Pro** (`/pro/*`) et **Fondateur** (`/fondateur`) non auditées en détail ; elles polluent le client via Profil et le bandeau QR — signalé ci-dessus uniquement.
