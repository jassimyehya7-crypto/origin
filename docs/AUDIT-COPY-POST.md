# Audit copy post-restyle — Épicerie Club (client)

**Date :** 2026-09-13  
**Cible :** `/workspace/epicerie-club`  
**Référence :** `docs/copy-grille.md`  
**Périmètre :** écrans CLIENT uniquement (accueil, carte, fiche offre, réservations, confirmation, favoris, nav, profil/q si copy visible)  
**Hors périmètre :** `pro/`, `fondateur/`, API, CSS purs, logique métier

## 1. Résumé (post-restyle)

Audit copy appliqué après le restyle UI. Style cible : **marché éditorial suisse** — direct, court, faits (heure, stock, commerce nommé), verbes clairs (`Réserver`, `Retirer`).

**Corrections grille obligatoires :** toutes appliquées (H2, placeholder, empty, meta carte).

**Audit élargi :** jargon client coupé ou raccourci (près de vous, Parcourez / en un clic, funnel QR, Stock déduit, Confirmer la réservation → Réserver, placeholders push dans le flux principal). `pro/` et `fondateur/` non touchés.

**Verdict :** PASS grille obligatoire · PASS nettoyage jargon principal · quelques points UX à valider (ci-dessous).

---

## 2. Table Fichier | Avant | Après | Statut

| Fichier | Avant | Après | Statut |
|---------|-------|-------|--------|
| `src/app/page.tsx` | Chip lieu `près de vous` | `VD` | corrigé |
| `src/app/page.tsx` | Placeholder `Rechercher un produit, un commerce…` | `Produit ou commerce` | corrigé |
| `src/app/page.tsx` | H1 `Les offres près / de chez vous.` | `Les offres à / Villeneuve.` | corrigé (vague → lieu nommé) |
| `src/app/page.tsx` | H2 `Aujourd'hui` (restyle ; grille attendait `Offres près de vous` → cible) | `À Villeneuve aujourd'hui` | corrigé |
| `src/app/page.tsx` | Sous-H2 `{n} offre(s) · retrait en magasin` | `{n} offre(s) · à retirer aujourd'hui` | corrigé (aligné grille OK) |
| `src/app/page.tsx` | Empty titre `Aucune offre pour ce filtre` | `Rien pour ce filtre` | corrigé |
| `src/app/page.tsx` | Empty corps `Revenez plus tard ou changez de catégorie.` | `Changez de catégorie, ou revenez plus tard.` | corrigé |
| `src/app/page.tsx` | `Voir tout` / `Commerces Villeneuve` / pied `Réservation gratuite · …` | — | déjà OK |
| `src/components/OfferCard.tsx` | Meta `{n} {unit}s · aujourd'hui` | `Aujourd'hui · encore {n}` | corrigé |
| `src/components/OfferCard.tsx` | CTA `Réserver` · stock bas `{n} restant(s)` · `Épuisée` · `Villeneuve` | — | déjà OK |
| `src/app/offre/[id]/OfferDetailClient.tsx` | CTA `Confirmer la réservation` | `Réserver` | corrigé |
| `src/app/offre/[id]/OfferDetailClient.tsx` | Pied `Gratuit · Stock déduit à la demande · Validité jusqu'à fermeture` | `Réservation gratuite · Pas de paiement en ligne · Retrait en magasin` | corrigé |
| `src/app/offre/[id]/OfferDetailClient.tsx` | Heure `Aujourd'hui jusqu'à {h}` · stock `{n} restant(s)` · commerce nommé | — | déjà OK |
| `src/app/reservations/page.tsx` | Empty `Parcourez les offres Villeneuve et réservez en un clic.` | `Réservez une offre à Villeneuve.` | corrigé |
| `src/app/reservations/page.tsx` | Lien `Voir les offres →` | `Voir les offres` | corrigé |
| `src/app/reservations/page.tsx` | Titres onglets / codes / badges | — | déjà OK |
| `src/app/confirmation/[id]/page.tsx` | Pending `… Vous serez notifié (push / email — placeholders).` | `… Présentez le code au retrait.` | corrigé |
| `src/app/confirmation/[id]/page.tsx` | Bandeau démo Push/email placeholders | retiré (bruit client) | corrigé |
| `src/app/confirmation/[id]/page.tsx` | `À retirer aujourd'hui avant {h}` · `Code de retrait` · CTAs | — | déjà OK |
| `src/app/favoris/page.tsx` | Sous-titre `Commerces que vous suivez à Villeneuve` | `Favoris à Villeneuve` | corrigé |
| `src/app/favoris/page.tsx` | Empty `Aucun favori pour l'instant` / description longue | `Aucun favori` / `Ajoutez un commerce depuis une offre.` | corrigé |
| `src/components/client/BottomNav.tsx` | Accueil · Réservations · Favoris · Profil | — | déjà OK / inchangé volontairement |
| `src/app/q/[shopSlug]/QrClient.tsx` | `Bienvenue ! Voici les offres du jour…` | `Offres du jour — réservez, retirez ici.` | corrigé |
| `src/app/q/[shopSlug]/QrClient.tsx` | `Scan QR enregistré (attribution démo)` | `Scan enregistré` | corrigé |
| `src/app/q/[shopSlug]/QrClient.tsx` | Empty `…comptée dans le funnel QR` | `Revenez plus tard, ou voyez tout Villeneuve.` | corrigé |
| `src/app/profil/page.tsx` | Lien fondateur `… KPIs · QR funnel` | `Pilotage Villeneuve` | corrigé |
| `src/app/profil/page.tsx` | Notifications placeholders (démo) | — | inchangé volontairement (outil démo) |
| `src/components/StatusBadge.tsx` + `lib/labels.ts` | Labels Épuisée / Confirmée / etc. | — | déjà OK / inchangé volontairement |
| `src/app/pro/**`, `src/app/fondateur/**` | — | — | hors périmètre (non touchés) |

---

## 3. Points encore flous / à valider avec UX

1. **H1 vs H2 accueil** — H1 = `Les offres à Villeneuve.` · H2 = `À Villeneuve aujourd'hui`. Possible redondance lieu ; valider si H1 doit être plus éditorial (« Les bons plans du jour » déjà en eyebrow) ou plus action (« Réservez aujourd'hui »).
2. **Unité stock carte** — grille demande `Aujourd'hui · encore {n}` (sans unité). Sur fiche, l’unité (`pièce`, etc.) reste affichée. OK pour scannabilité carte ; confirmer si l’unité doit revenir en meta courte.
3. **CTA fiche `Réserver` vs étape** — la fiche envoie déjà la demande ; « Réserver » est plus court et aligné grille. Alternative UX : garder « Confirmer » si on veut distinguer carte → fiche.
4. **Confirmation pending** — suppression du bandeau placeholders : plus propre côté client, mais la démo perd le rappel push/email. Remettre une note discrète dans Profil seulement ?
5. **Profil « Notifications (placeholders) »** — jargon démo encore visible ; laisser pour les testeurs ou masquer en mode « client pur ».
6. **Eyebrow `Les bons plans du jour`** — ton éditorial OK ; pas dans la grille obligatoire. Garder ou remplacer par un fait (`{n} offres`).

---

## 4. Checklist grille

- [x] Accueil (titre H2, search, empty, pied)
- [x] Carte offre (meta `Aujourd'hui · encore {n}` · CTA Réserver · stock bas / Épuisée)
- [x] Fiche offre + CTA
- [x] Réservation / confirmation
- [x] Favoris / nav bas

Owner copy : Copy Client. Coordination : Chef de cabinet.

---

## Diff résumé (fichiers modifiés)

1. `src/app/page.tsx`
2. `src/components/OfferCard.tsx`
3. `src/app/offre/[id]/OfferDetailClient.tsx`
4. `src/app/reservations/page.tsx`
5. `src/app/confirmation/[id]/page.tsx`
6. `src/app/favoris/page.tsx`
7. `src/app/q/[shopSlug]/QrClient.tsx`
8. `src/app/profil/page.tsx`
9. `docs/AUDIT-COPY-POST.md` *(ce rapport)*

**Non modifiés (déjà OK) :** `BottomNav.tsx`, `StatusBadge.tsx`, `offre/[id]/page.tsx` (pas de copy), `q/[shopSlug]/page.tsx` (pas de copy).
