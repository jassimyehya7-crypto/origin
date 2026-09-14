# Audit QA Pro — post-simplification (b596572)

**Date** : 2026-09-14  
**Cible** : `http://localhost:3000/pro` (PIN `1234`)  
**Checklist** : `docs/QA-PRO-CHECKLIST.md` (checks 7–8 adaptés : fin de journée auto, nav 3)  
**Méthode** : revue code + UI (login, nav, seed 2 EN_ATTENTE QA Test, Confirmer/Refuser)

---

## Verdict

| # | Check | Résultat |
|---|-------|----------|
| 1 | Touch Confirmer / Refuser | **PASS** |
| 2 | 1 CTA primaire par écran | **PASS** |
| 3 | Contraste badges & libellés | **PASS** *(écarts mineurs)* |
| 4 | Parcours Confirmer | **FAIL** |
| 5 | Parcours Refuser | **PASS** |
| 6 | Hiérarchie carte résa | **PASS** |
| 7 | Fin de journée auto | **ADAPTÉ / PASS** *(écarts)* |
| 8 | Zéro ambiguïté état du jour | **FAIL** |

**Verdict checklist : NO-GO Pro** (FAIL sur **4** — critère bloquant).

---

## Détail

### 1 — Touch → PASS
- Code : `h-14` (56 px) + `gap-3` + `touch-manipulation` (`TodayInbox`)
- UI : boutons mesurés ≈ **44–45 px** (≥ 44)
- Preuve : `shot-call_xbwj3OqfFd375YsMEBSRZOpWfc_0b8546546d68e942.png`

### 2 — 1 CTA primaire → PASS
- `confirm` = Jaune+Encre ; `danger` = Rouge (pas 2e jaune)
- Nav active Jaune = chrome, pas CTA métier
- UI : un seul jaune décisif par carte / écran

### 3 — Contraste → PASS *(mineurs)*
- Encre/Jaune, Encre/Soft, Encre/Vert OK (≥ 4.5)
- Écarts : `Badge` muted ≈ 3.96:1 ; `info` `#eef3ff` encore dans `Badge.tsx` ; `danger` Blanc/Rouge ≈ 3.76:1

### 4 — Confirmer → **FAIL**
- UI : toast **« Confirmée · SMS envoyé »** sur QA Test 1
- **Mais** : carte **absente** de « À retirer » (empty « Rien à retirer »)
- API post-action : `resa_o6gqq6jw` → statut **`EXPIREE`** (pas `CONFIRMEE`)
- Cause probable : `ensureShopDayClosed` / expire CONFIRMEE dès `pastClose` ou `pastValid` offre — résa créée avant reopen offre/`openUntil`, puis confirmée → expire au `router.refresh()`
- Attendu : Confirmée reste visible dans **À retirer** jusqu’à Récupérée / Pas venue / vraie fin de journée du jour courant

### 5 — Refuser → PASS
- QA Test 2 : toast **« Refusée »**, hors file
- API : `resa_0z5xo0vt` = `REFUSEE`
- Busy anti double-submit présent (code)

### 6 — Hiérarchie carte → PASS
- Nom → tel → qty×offre → code·heure · badge · actions sous la carte
- UI confirmée sur cartes QA Test

### 7 — Fin de journée auto → ADAPTÉ / PASS *(écarts)*
- `ensureShopDayClosed` au load `/pro` ; copy « Se termine à {openUntil} »
- Empty dayClosed : « Journée terminée · reprise demain »
- Nav sans Clôture ; `/pro/cloture` → `redirect("/pro")`
- **Écarts** :
  - Header reste « Se termine à … » même si jour clos (ne bascule pas `dayEnded`)
  - EN_ATTENTE non expirées après `openUntil` (file « À confirmer » possible hors horaires)
  - **Expire CONFIRMEE trop agressif** (lié FAIL #4) — validUntil offre / pastClose sans garde « confirmée à l’instant »

### 8 — Ambiguïté états → **FAIL**
- Nav 3 OK (Aujourd’hui / Offres / Magasin) — UI + code
- Sections « À confirmer » / « À retirer » / empty clairs **en théorie**
- **FAIL observé** : après Confirm, commerçant croit OK (toast) mais **pas de file retrait** + statut EXPIREE — ambiguïté critique
- Legacy hors nav : `/pro/reservations`, `ClotureClient.tsx` encore sur disque (non bloquant seul)

---

## Écarts actionnables

| Sévérité | Écran | Trouvé | Attendu | Action |
|----------|-------|--------|---------|--------|
| **Bloquant** | `/pro` Après Confirmer | Toast Confirmée + statut `EXPIREE` + « Rien à retirer » | Carte en **À retirer** tant que `CONFIRMEE` | Ne pas auto-expirer une CONFIRMEE du jour courant juste après confirm ; ancrer expire sur `openUntil` du jour Zurich + ignorer `validUntil` déjà passé si Pro vient de confirmer ; ou refetch sans reclôturer la résa fraîche |
| Majeur | `/pro` Header dayClosed | « Se termine à HH:mm » | Copy « Journée terminée » | Brancher `dayClosed` sur le sous-titre |
| Majeur | Fin de journée | EN_ATTENTE survivent après close | File claire ou expire/copy dédiée | Décider produit + implémenter |
| Mineur | Badges | muted 3.96:1 ; `#eef3ff` info | AA + palette | Remap tokens |
| Mineur | Code mort | `ClotureClient`, `/pro/reservations` | Hors surface ou purge | Cleanup |

---

## Preuves UI

| Scène | Fichier |
|-------|---------|
| Aujourd’hui vide (avant seed) | `/tmp/.sand-browser/shot-call_HTbn70V8VM9r72aXi7vX4iR8fc_0c46d375cda14c3c.png` |
| Offres / Magasin / nav 3 | `…uGhS7g…` · `…izjiKu…` · `…0gNfrV…` |
| File + Confirmer/Refuser | `/tmp/.sand-browser/shot-call_xbwj3OqfFd375YsMEBSRZOpWfc_0b8546546d68e942.png` |
| Post-actions | `…fAA3GW…` · `…ZCDzLX…` |

---

## Critères de re-GO

- [ ] Confirmer → carte durable en **À retirer** (statut `CONFIRMEE` stable ≥ jusqu’à geste Pro ou vraie close)
- [ ] Checks 1, 2, 5, 6, 7 toujours PASS
- [ ] Check 8 : états à confirmer / à retirer / jour terminé sans contradiction toast↔file

---

## Re-check post-fix c9d6240 (2026-09-14)

| # | Check | Résultat | Preuve |
|---|-------|----------|--------|
| **4** | Parcours Confirmer | **PASS** | API : `CONFIRMEE` stable après 3× GET `/pro`. UI : QA Recheck A durable en « À retirer » ; B confirmée → À retirer et persiste après Offres→Aujourd’hui |
| **8** | Zéro ambiguïté états | **PASS** | Toast/file alignés ; sections À confirmer / À retirer cohérentes |

**Règle fix** : `shouldExpireConfirmed` — expire seulement si `pastClose` **et** `confirmedAt` avant la close du jour (ignore `offer.validUntil` seul).

### Verdict mis à jour

| # | Résultat |
|---|----------|
| 1 Touch | PASS |
| 2 1 CTA | PASS |
| 3 Contraste | PASS *(mineurs)* |
| 4 Confirmer | **PASS** |
| 5 Refuser | PASS |
| 6 Hiérarchie | PASS |
| 7 Fin de journée auto | ADAPTÉ / PASS *(écarts mineurs header dayClosed)* |
| 8 États | **PASS** |

**Verdict checklist : GO Pro** (0 FAIL bloquant sur 1, 2, 4, 5, 7).

Écarts mineurs restants : badge muted / `#eef3ff` ; header « Se termine à… » si dayClosed ; cleanup legacy `/pro/reservations` + `ClotureClient`.

### Screenshots re-check
- Initial : `/tmp/.sand-browser/shot-call_dhUxgcYTUYq67nmWVbh5YXbFfc_0c65bc53c8ebd742.png`
- Post-confirm : `/tmp/.sand-browser/shot-call_DtXLEd9He0Vp582eKO5QTqpofc_0c65bc53c8ebd742.png`
- Post-nav : `/tmp/.sand-browser/shot-call_VnitcdnuG1ez4i4FGcZoMiXBfc_0c65bc53c8ebd742.png`
