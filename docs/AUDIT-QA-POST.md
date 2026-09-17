# Audit QA client — post-restyle

**Cible** : `http://localhost:3000` · code `/workspace/offreslocal`  
**Date** : 2026-09-13  
**Périmètre** : contraste, touch targets, logo, cohérence Villeneuve, parcours réservation  
**Méthode** : revue code client + parcours UI (feed → fiche → résa → confirmation → nav)

**Références** : palette `docs/AUDIT-COULEURS.md` · tokens `tailwind.config.ts`

---

## Synthèse

| Sévérité | Count | IDs |
|----------|------:|-----|
| Bloquant | 3 | B1–B3 |
| Majeur | 10 | M1–M10 |
| Mineur | 7 | m1–m7 |

**Verdict** : restyle palette/tokens OK sur le chrome principal ; **GO bloqué** tant que B1–B3 ne sont pas traités (runtime feed + contraste badges Vert).

**Priorité fix** : B1 (crash) → B2/B3 (badges Vert) → M1 (hors palette Tailwind) → M2–M6 (touch 44px) → M7–M10 (proximité / créneau / rouge / mute) → mineurs.

---

## PASS

| Zone | Critère | Détail |
|------|---------|--------|
| Tokens Tailwind + `globals.css` | contraste / palette | Encre, Jaune, Bleu, Vert, Rouge, Papier, Surface, Règle, Mute, soft |
| Fonds de page | jaune | `bg-ec-paper` / `bg-ec-surface` — jamais jaune pleine page |
| Logo | logo | « é » sur Jaune + bordure Encre, tilt −3°, texte marque ; `inverted` OK sur header QR |
| BottomNav | touch / jaune | ~72×53 px ; actif Jaune+Encre (chip, pas page) |
| Button md/lg + confirm | touch / jaune | `h-11`/`h-12` ; `variant="confirm"` Jaune+Encre (rare) |
| Mentions Villeneuve | villeneuve | Feed, cards, fiche, favoris, résa empty, profil, confirmation, QR |
| Seed commerces | villeneuve | Da Silva, Durgnat, Macheret… adresses locales |
| Parcours principal | parcours-résa | Feed → `/offre/[id]` → qty → POST résa → `/confirmation/[id]` (ticket `EC-1080` observé) |
| Stock épuisé (fiche) | parcours-résa | CTA Indisponible disabled + message |
| Empty states | parcours-résa | Favoris / résa / filtre / QR sans offre |
| Search + CTA sticky | touch | Input `h-11` ; CTA sticky `lg` |
| Focus visible | contraste | Outline Bleu 3px |
| Hiérarchie fiche (UI) | parcours-résa | Offre → prix → commerce → distance/heure/stock → action |

---

## ÉCARTS — Bloquants

### B1 — Runtime feed / fiche (`formatWalkDistance` + chunk Next)
- **Écran** : `/`, `/offre/[id]` (après navigation)
- **Critère** : parcours-résa / stabilité
- **Trouvé** : erreur runtime `formatWalkDistance is not a function` (`OfferCard.tsx:42`), puis `Cannot find module './948.js'` → page blanche HTTP 500
- **Attendu** : feed et fiche stables après navigation
- **Action** : corriger import/export de `formatWalkDistance` ; rebuild / nettoyer `.next` ; rejouer feed → fiche → résa
- **Preuve UI** : screenshot état 500

### B2 — Badge `arrivage` Vert + Blanc
- **Écran** : OfferCard / OfferDetail / `Badge` variant `arrivage`
- **Critère** : contraste
- **Trouvé** : `bg-ec-green text-white` (#0CAF68 / #FFF) ≈ **2.86:1**
- **Attendu** : ≥ 4.5:1 (badge ~11px)
- **Action** : texte Encre sur Vert, ou pastille Vert + texte Encre à côté

### B3 — Badge `success` / CONFIRMEE Vert soft
- **Écran** : `/reservations`, `/confirmation/[id]`
- **Critère** : contraste
- **Trouvé** : `bg-ec-soft text-ec-green` (#ECEFE8 / #0CAF68) ≈ **2.46:1**
- **Attendu** : ≥ 4.5:1
- **Action** : `text-ec-ink` + pastille Vert, ou `bg-ec-green` + `text-ec-ink`, ou bordure Vert + Encre

---

## ÉCARTS — Majeurs

### M1 — Classes hors palette (amber / red-* / `#eef3ff`)
- **Écran** : `Badge` warning/danger/info ; confirmation pending ; bandeau indispo fiche ; info push
- **Critère** : contraste / palette
- **Trouvé** : `bg-amber-100`, `text-amber-800`, `bg-red-100`, `text-red-700`, `bg-[#eef3ff]`, etc.
- **Attendu** : uniquement tokens `ec-*`
- **Action** : remapper — warning → Jaune+Encre ou soft+Encre ; danger → soft+Rouge/Encre ; info → soft+Bleu

### M2 — Badge `flash` / prix deal Rouge
- **Écran** : OfferCard / OfferDetail
- **Critère** : contraste
- **Trouvé** : `bg-ec-red text-white` et `text-ec-red` ≈ **3.76:1** (échec AA corps / badge 11px)
- **Attendu** : ≥ 4.5:1 pour badges ; display large ≥ 3:1 OK
- **Action** : badges → Encre sur fond soft/rule teinté, ou Blanc sur Encre + accent Rouge

### M3 — Mute sur Papier / Soft
- **Écran** : global (métadonnées `text-ec-muted`)
- **Critère** : contraste
- **Trouvé** : Mute/Papier ≈ **4.24:1** ; Mute/Soft ≈ **3.96:1** — sous AA pour `text-xs`/`text-sm`
- **Attendu** : ≥ 4.5:1
- **Action** : assombrir Mute ou passer micro-textes en Encre ; confirmer en UI (adresses/horaires peu saillants)

### M4 — Chips catégories
- **Écran** : `/`
- **Critère** : touch
- **Trouvé** : `px-3.5 py-2 text-xs` ≈ **~31–33 px** de hauteur
- **Attendu** : ≥ 44×44 px
- **Action** : `min-h-11` + padding horizontal suffisant

### M5 — QuantitySelector +/−
- **Écran** : `/offre/[id]`
- **Critère** : touch
- **Trouvé** : `h-10 w-10` (**40 px**)
- **Attendu** : ≥ 44 px
- **Action** : `h-11 w-11` (min) ou hit-area élargie

### M6 — Retour / favori fiche
- **Écran** : `/offre/[id]`
- **Critère** : touch
- **Trouvé** : `ArrowLeft` / `Heart` en `h-10 w-10` (**40 px**)
- **Attendu** : ≥ 44 px
- **Action** : `h-11 w-11` (min)

### M7 — Button `sm` (ResetDemo)
- **Écran** : `/`, `/profil`
- **Critère** : touch
- **Trouvé** : `Button` sm = `h-9` (**36 px**)
- **Attendu** : ≥ 44 px
- **Action** : sm ≥ `h-11`, ou forcer `md` côté client

### M8 — Onglets réservations
- **Écran** : `/reservations`
- **Critère** : touch
- **Trouvé** : `py-2.5 text-sm` ≈ **~38 px**
- **Attendu** : ≥ 44 px
- **Action** : `min-h-11` + centrage vertical

### M9 — Copy proximité vs tri réel
- **Écran** : `/`
- **Critère** : villeneuve / parcours-résa
- **Trouvé** : « Villeneuve · les plus proches d'abord » alors que `getOffers` trie par date, pas lat/lng
- **Attendu** : tri proximité réel, ou copy honnête
- **Action** : implémenter distance **ou** retirer la promesse de proximité

### M10 — Pas de sélecteur de créneau
- **Écran** : `/offre/[id]`
- **Critère** : parcours-résa
- **Trouvé** : qty + message libre (« Je passe vers 17h ») ; pas de chips créneau ; validité = `validUntil` magasin
- **Attendu** (brief) : feed → fiche → qty/**créneau** → confirm → ticket
- **Action** : chips créneaux persistés sur la résa, **ou** documenter l’abandon du créneau et ajuster le brief

---

## ÉCARTS — Mineurs

### m1 — Retour arrière fixe
- **Écran** : `/offre/[id]`
- **Critère** : parcours-résa
- **Trouvé** : `Link href="/"` — depuis QR/favoris, retour = accueil, pas le contexte
- **Action** : `router.back()` + fallback `/`

### m2 — Copy hero / search vague
- **Écran** : `/`
- **Critère** : villeneuve
- **Trouvé** : « Les offres près de chez vous » ; placeholder long
- **Action** : ex. « À Villeneuve aujourd’hui » ; « Produit ou commerce »

### m3 — `shop.color` seed hors palette
- **Écran** : seed (non rendu UI client actuel)
- **Critère** : palette
- **Trouvé** : HEX Material dans `seed.ts`
- **Action** : aligner `ec-*` ou retirer le champ côté client

### m4 — Overlay `EPUISEE` quasi mort dans le feed
- **Écran** : OfferCard
- **Critère** : parcours-résa
- **Trouvé** : feed `publishedOnly` = `PUBLIEE` → overlay jamais vu ; accessible via URL directe
- **Action** : inclure `EPUISEE` du jour grisé **ou** retirer le code mort

### m5 — CTA « Réserver » décoratif sous 44 px
- **Écran** : feed cards (UI)
- **Critère** : touch
- **Trouvé** : pastille visible ~79×32 px (carte entière cliquable = OK)
- **Action** : hausser la pastille visuelle à ≥ 44 px de haut **ou** accepter si hit-area = carte entière documentée

### m6 — CTA fiche jaune puis noir selon revisite
- **Écran** : `/offre/[id]` (UI)
- **Critère** : parcours-résa / cohérence
- **Trouvé** : « Confirmer la réservation » (jaune) puis « Réserver » (noir) après revisite
- **Action** : standardiser libellé + variant selon état (pré-confirm vs confirm)

### m7 — Métadonnées peu saillantes (UI)
- **Écran** : feed / fiche
- **Critère** : contraste
- **Trouvé** : adresse, horaires, mentions légales petites / grises
- **Action** : aligné M3 — contraste et/ou taille

---

## Parcours réservation — checklist

| Étape | Statut | Note |
|-------|--------|------|
| Feed / offre | PASS* | *instable après nav (B1) |
| Fiche détail | PASS* | hiérarchie OK ; touch M5/M6 |
| Qty | PASS | fonctionne ; hit < 44 px |
| Créneau | FAIL | message libre seulement (M10) |
| Confirmation / ticket | PASS | code, statut, montant, retrait lisibles |
| Retour / nav | PARTIEL | back fixe (m1) ; BottomNav OK |
| Stock épuisé | PASS (fiche) | feed n’expose pas EPUISEE (m4) |

---

## Critères de GO (post-fix)

- [ ] 0 crash runtime sur feed ↔ fiche ↔ résa
- [ ] Contraste AA sur tous les badges / microcopies
- [ ] 0 couleur hors palette sur UI chrome
- [ ] Touch targets ≥ 44×44 px sur contrôles interactifs
- [ ] Copy proximité honnête **ou** tri distance réel
- [ ] Créneaux décidés (implémentés **ou** brief mis à jour)
- [ ] Logo + Villeneuve inchangés (déjà PASS)

---

## Preuves UI

| Écran | Fichier |
|-------|---------|
| Feed | `/tmp/.sand-browser/shot-call_Cb5YNgsDMnmEiqNiB8OcMEK4fc_0ef73b2491a1db6a.png` |
| Fiche détail | `/tmp/.sand-browser/shot-call_itFnRxdxjEWI5cedAfutJXiAfc_0ef73b2491a1db6a.png` |
| Confirmation | `/tmp/.sand-browser/shot-call_XorpkMcDpafmMNuxW0cwxJMZfc_0ef73b2491a1db6a.png` |
| Réservations | `/tmp/.sand-browser/shot-call_s93TI2DV3POAGwjL46aNowcRfc_0ef73b2491a1db6a.png` |
| Profil / nav | `/tmp/.sand-browser/shot-call_IFIIqxgnMv52rGJD287oBJOYfc_0ef73b2491a1db6a.png` |
| Crash HTTP 500 | `/tmp/.sand-browser/shot-call_7NDLPgsm1qUYweENzDfzLT5gfc_0ef73b2491a1db6a.png` |

---

## Re-check post-patch (2026-09-13, build prod `npm start`)

| ID | Statut | Preuve |
|----|--------|--------|
| **B1** | **PASS** | `GET /` → 200 ; `GET /offre/offer_croissants` → 200 ; distances rendues (« À 200 m ») ; plus d’erreur `948.js` |
| B2 | PARTIEL (à confirmer après patch badges) | HTML feed : badge Arrivage déjà `bg-ec-green text-ec-ink` (plus `text-white`) |
| B3 | PENDING | Patch badges encore annoncé en cours |
| M9 / m2 | PARTIEL | Copy feed « Aujourd'hui à Villeneuve · 8 offres » ; placeholder « Produit ou commerce » |

**GO** : toujours bloqué sur validation B2/B3 + majeurs restants (touch, créneau, rouge/mute, hors palette si encore présents).

---

## Re-check B1–B3 (post patch badges + rebuild prod)

| ID | Statut | Preuve |
|----|--------|--------|
| **B1** | **PASS** | `/`, `/offre/offer_pain`, `/reservations` → 200 |
| **B2** | **PASS** | `arrivage: bg-ec-green text-ec-ink` ; Encre/Vert ≈ **6.10:1** (était 2.86:1) ; feed HTML confirme |
| **B3** | **PASS** | `success: bg-ec-soft text-ec-ink` + pastille Vert ; Encre/Soft ≈ **15.01:1** (était 2.46:1) |

**Bloquants ouverts : 0.**

Reste (non bloquant pour B1–B3) : M1 `info: bg-[#eef3ff]` encore présent ; `flash` Blanc/Rouge ≈ 3.76:1 ; touch M4–M8 ; créneau M10 ; etc.
