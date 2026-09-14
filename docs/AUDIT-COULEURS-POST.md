# Audit couleurs post-restyle — Épicerie Club (client)

**Date :** 2026-09-13  
**Cible :** `/workspace/epicerie-club`  
**Référence :** `BRAND.md` / `DESIGN.md` + grille `docs/AUDIT-COULEURS.md`  
**Routes auditées :** `/`, `/offre/[id]`, `/confirmation/[id]`, `/reservations`, `/favoris`, `/profil`  
**Méthode :** scan tokens + classes TSX + contrastes WCAG + captures navigateur (voir `docs/audit-shots/`)

## Verdict global

**GO couleurs client** (post-patch P0, 2026-09-13) — tokens + badges + confirmation + rouge promo OK. Soft `#ECEFE8` / `#EEF3FF` à documenter ; fondateur/pro hors scope encore partiels.

Jaune Club : **OK (rare)** — logo, nav active, CTA `confirm`, check confirmé. Pas de fond de page jaune.

---

## Tokens globaux

| Token | HEX | Attendu | Verdict |
|---|---|---|---|
| `--ec-ink` / `ec.ink` | `#171B15` | Encre | PASS |
| `--ec-yellow` / `ec.yellow` | `#EAFF4F` | Jaune Club | PASS |
| `--ec-blue` / `ec.blue` | `#255CFF` | Bleu local | PASS |
| `--ec-green` / `ec.green` | `#0CAF68` | Vert retrait | PASS |
| `--ec-red` / `ec.red` | `#EB4A3F` | Rouge offre | PASS |
| `--ec-paper` / `ec.paper` | `#F5F6F2` | Papier | PASS |
| `--ec-surface` / `ec.surface` | `#FFFFFF` | Surface | PASS |
| `--ec-rule` / `ec.rule` | `#DDE1D8` | Règle | PASS |
| `--ec-muted` / `ec.muted` | `#71776D` | Mute | PASS |
| `--ec-soft` / `ec.soft` | `#ECEFE8` | — | **WARN** — hors des 9 HEX BRAND (présent aussi dans la référence brand) |

Aliases legacy (`ec.bg`, `ec.line`, `ec.dark`, `ec.bright`, `ec.leaf`, `ec.orange`→rouge) : OK fonctionnellement ; `ec.orange` nommé trompeur.

---

## Checklist par route (client)

### `/` Feed
| Critère | Verdict | Notes |
|---|---|---|
| Fond Papier | PASS | `bg-ec-paper` |
| Cartes Surface + Règle | PASS | OfferCard |
| Texte Encre / Mute | PASS | |
| Distance Bleu | PASS | `text-ec-blue` + LocateFixed |
| Promo Rouge | PASS | deal / stock bas |
| Dispo Vert | PASS | PackageCheck |
| CTA Encre | PASS | bouton Réserver |
| Jaune rare | PASS | BottomNav active + Logo seulement |
| Hors palette | PASS | chrome |

### `/offre/[id]`
| Critère | Verdict | Notes |
|---|---|---|
| Hiérarchie + palette | PASS | titre Encre, deal Rouge, map Bleu, heure Vert |
| CTA confirm Jaune | PASS | `variant="confirm"` — usage décisif OK |
| Indisponible | **FAIL** | `bg-red-50 text-red-700` (Tailwind Material) → utiliser `ec-red` / soft dérivé |

### `/confirmation/[id]`
| Critère | Verdict | Notes |
|---|---|---|
| Confirmé | PASS | cercle `bg-ec-yellow` + Encre |
| En attente | **FAIL** | `bg-amber-100` / `text-amber-600` hors palette |
| Refus / autre | **FAIL** | `bg-red-100` hors palette (icône `text-ec-red` OK) |
| Info push | WARN | fond `#eef3ff` (teint Bleu) — acceptable comme dérivé si documenté |
| CTA confirm Jaune | PASS | |

### `/reservations`
| Critère | Verdict | Notes |
|---|---|---|
| Chrome | PASS | Papier / Surface / Encre / tabs Encre |
| Badges statut | **FAIL** | via Badge `warning`/`danger` → amber/red Tailwind |
| Liens | PASS | `text-ec-blue` |

### `/favoris`
| Critère | Verdict | Notes |
|---|---|---|
| Chrome | PASS | |
| Offres actives Vert | PASS | `text-ec-green` |
| `shop.color` seed | N/A UI | couleurs Material encore dans `seed.ts` mais **non rendues** dans le chrome client |

### `/profil`
| Critère | Verdict | Notes |
|---|---|---|
| Chrome | PASS | avatar Encre, cards Surface, Jaune nav |
| Panneaux notif | **WARN** | `bg-ec-soft` OK si soft documenté ; Mute sur Soft = contraste faible (~3.9) |
| Visuel | WARN | soft perçu « gris-vert » ; sous-textes Mute peu lisibles |

### BottomNav (toutes routes client)
| Critère | Verdict | Notes |
|---|---|---|
| Actif Jaune+Encre | PASS | rare, correct |
| Inactif Mute | PASS | |

---

## Contrastes (calculés)

| Paire | Ratio | Verdict |
|---|---|---|
| Encre / Papier | 16.07 | PASS AA |
| Encre / Surface | 17.44 | PASS AA |
| Mute / Surface | 4.60 | PASS AA |
| Mute / Papier | 4.24 | **WARN** — sous 4.5 pour corps de texte |
| Encre / Jaune | 15.71 | PASS AA |
| Blanc / Bleu | 5.18 | PASS AA |
| Blanc / Rouge | 3.76 | WARN — OK gros/bold seulement |
| Blanc / Vert `#0CAF68` | **2.86** | **FAIL** — badge `arrivage` (`bg-ec-green text-white`) |
| Vert / Soft | **2.46** | **FAIL** — badge `success` (`bg-ec-soft text-ec-green`) |
| Mute / Soft | **3.96** | **FAIL** — sous-texte notifs profil |

---

## Écarts à corriger (priorité)

1. **P0 — Contraste Vert**  
   - Badge arrivage : blanc sur `#0CAF68` insuffisant → Encre sur Vert, ou Vert outline sur Soft, ou texte Encre.  
   - Badge success : Vert sur Soft insuffisant → Encre, ou Vert plus saturé sur fond plus clair documenté, ou inverser.

2. **P0 — Fuites Tailwind hors palette (client)**  
   - `components/ui/Badge.tsx` : `warning` / `danger` → amber & red Material.  
   - `confirmation/[id]/page.tsx` : amber-100/600, red-100.  
   - `offre/.../OfferDetailClient.tsx` : `bg-red-50 text-red-700`.

3. **P1 — Soft & teintes**  
   - Documenter `#ECEFE8` (soft) et `#EEF3FF` (bleu soft) comme dérivés autorisés, ou les retirer.

4. **P2 — Seed `shop.color`**  
   - HEX Material encore en data (`#2E7D32`, `#EF6C00`, …). Pas affiché côté client aujourd’hui ; aligner sur palette ou supprimer le champ pour éviter une future fuite.

5. **P2 — Hors scope routes demandées mais noté**  
   - Fondateur : `bg-amber-500`, `bg-sky-500`, `bg-violet-500`, gray/amber alerts.  
   - Pro paramètres : `bg-gray-50`.

---

## Règle jaune — bilan

| Usage | OK ? |
|---|---|
| Logo mark | Oui |
| BottomNav active | Oui |
| Button `confirm` | Oui (moment décisif) |
| Confirmation success circle | Oui |
| Fond de page / section large | Non observé — PASS |

---

## Captures (visuel localhost:3000)

| Fichier | Route | Verdict visuel |
|---|---|---|
| `docs/audit-shots/feed.png` | `/` | PASS |
| `docs/audit-shots/offre.png` | `/offre/offer_croissants` | PASS |
| `docs/audit-shots/confirmation.png` | `/confirmation/resa_5` | FAIL — amber pending |
| `docs/audit-shots/confirmation-resa-1.png` | `/confirmation/resa_1` | FAIL — amber pending |
| `docs/audit-shots/reservations.png` | `/reservations` | FAIL — badges EN ATTENTE amber ; CONFIRMÉE Vert/Soft faible |
| `docs/audit-shots/favoris.png` | `/favoris` | PASS |
| `docs/audit-shots/profil.png` | `/profil` | WARN — Soft + Mute |

## Synthèse routes

| Route | Code | Visuel |
|---|---|---|
| `/` | PASS | PASS |
| `/offre/[id]` | FAIL (état indispo Material) | PASS (offre dispo) |
| `/confirmation/[id]` | FAIL | FAIL |
| `/reservations` | FAIL | FAIL |
| `/favoris` | PASS | PASS |
| `/profil` | WARN soft | WARN |

---

## GO / NO-GO

**GO** couleurs client (post-patch P0). Ancien NO-GO levé — confirmation, réservations, contrastes Vert corrigés.  

Patch minimal avant GO : Badge warning/danger + confirmation pending + contraste Vert (arrivage/success).

### Correctifs recommandés (cibles)

```
Badge warning  → bg-ec-soft text-ec-ink  (ou Rouge outline pour urgence douce)
Badge danger   → bg-ec-red/10 text-ec-red (si alpha OK) ou Soft + Rouge
Badge arrivage → bg-ec-green text-ec-ink  (meilleur contraste)
Badge success  → bg-ec-soft text-ec-ink + pastille Vert, ou text-ec-ink
Confirmation pending → bg-ec-soft + text-ec-ink (pas amber)
Offre indispo  → border-ec-red / text-ec-red / bg-ec-paper
```

---

## Recheck OfferCard (post P0 UX) — 2026-09-13

| Critère | Verdict | Détail |
|---|---|---|
| Distance Bleu `#255CFF` | PASS | `text-ec-blue` + MapPin |
| Jaune rare | PASS | aucun jaune sur la carte |
| Rouge prix / promo | **FAIL** | prix deal en `text-ec-ink` ; barré en Mute — plus de `text-ec-red` sur `-%` / offre |
| CTA | PASS | Encre + blanc |
| Heure / stock Vert icône | PASS | Clock + PackageCheck `text-ec-green` |

Même écart sur `/offre/[id]` (tête prix en Encre, pas Rouge).

**Correctif proposé :** `-% · prix` (ou le `%` seul) en `text-ec-red` ; prix barré reste Mute. Prix sans promo reste Encre.

---

## Re-audit post-patch P0 couleurs — 2026-09-13 (code)

### Correctifs vérifiés

| Item | Avant | Après | Verdict |
|---|---|---|---|
| Badge `warning` | amber Material | Soft + Encre | PASS |
| Badge `danger` | red Material | `ec-red/10` + Rouge | PASS (contraste ~3.3 — OK UI bold) |
| Badge `arrivage` | Vert + Blanc (2.86 FAIL) | Vert + Encre (6.1) | PASS |
| Badge `success` | Soft + Vert (2.46 FAIL) | Soft + Encre + pastille Vert | PASS |
| Confirmation pending | amber-100/600 | Soft + Encre | PASS |
| Confirmation refus | red-100 | `ec-red/10` + Rouge | PASS |
| Offre indispo | red-50/700 | border Rouge + Papier + texte Rouge | PASS |
| OfferCard deal | Encre | Rouge si promo, barré Mute, sinon Encre | PASS |
| Fiche offre deal | Encre | idem Rouge | PASS |
| Client Material leftovers | amber/red/gray | **0** hors fondateur/pro | PASS |

### Contrastes post-patch

| Paire | Ratio | Verdict |
|---|---|---|
| Encre / Vert (arrivage) | 6.10 | PASS AA |
| Encre / Soft (success/warning) | 15.01 | PASS AA |
| Rouge / Surface (flash, danger text) | 3.76 | WARN — OK bold/large seulement |
| Rouge / red≈10% | ~3.31 | WARN — badges danger OK bold |

### Jaune rare

Inchangé : logo, nav active, CTA confirm, cercle confirmé. **PASS**.

### Verdict re-audit (code)

**GO conditionnel client** — P0 audit couleurs corrigés sur routes client.  

Restes non bloquants :
- Soft `#ECEFE8` + teinte `#EEF3FF` à documenter
- Mute / Soft ~3.96 (notifs profil) — WARN
- Blanc / Rouge sur badges flash — WARN bold
- Seed `shop.color` Material (non rendu UI)
- Fondateur / Pro encore hors palette (hors scope routes client)

### Captures visuelles post-patch

| Fichier | Route | Verdict |
|---|---|---|
| `docs/audit-shots/feed-p0.png` | `/` | PASS — prix promo Rouge, jaune logo/nav |
| `docs/audit-shots/offre-p0.png` | `/offre/…` | PASS — deal Rouge |
| `docs/audit-shots/confirmation-p0.png` | `/confirmation/…` | PASS — pending Soft, plus d’amber |
| `docs/audit-shots/reservations-p0.png` | `/reservations` | PASS — EN ATTENTE Soft+Encre ; CONFIRMÉE Soft+Encre+pastille Vert |

### Verdict final post-patch

**GO couleurs client** — P0 résolus (code + visuel). Restes WARN non bloquants (Soft/EEF3FF à documenter, Mute/Soft notifs, seed `shop.color`, hors-scope fondateur/pro).
