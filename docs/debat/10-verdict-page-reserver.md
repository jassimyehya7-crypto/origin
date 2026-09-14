# Verdict juge — Page Réserver (MVP Villeneuve)

**Dossier :** synthèse Ange + Diable + clarification Yehya (test réel, pas bug « JJ »)  
**Prod de référence :** `df1c28f` (UI) + `6590bbb` (seven.io)  
**Hors chemin :** OTP inline (sauf Pattern C après no-show déclaré — `03` / `09`)

---

## 3 points exécutables

### (1) Téléphone obligatoire — **OUI (MVP)**

| | |
|---|---|
| **Verdict** | Tél. **obligatoire** à la résa — **plus skippable** |
| **Browse** | Toujours libre (pas de mur QR / feed) — gate seulement au **gel stock** |
| **Format** | Numéro **suisse valide** (`isValidSwissPhone`) |
| **Ange** | Retenu (requis au gel stock) |
| **Diable** | Rejeté pour le MVP (skippable / faux 079) — trade-off assumé fondateur |
| **Amendement** | Surcharge `03` / `06` (tél. skippable) pour le MVP Villeneuve |

### (2) Règle prénom — **≥ 3 lettres**

| | |
|---|---|
| **Verdict** | Bloquer **1–2 lettres** ; **≥ 3 OK** |
| **Label UI** | `Prénom` (pas « ou pseudo » en avant) |
| **Authenticité** | **Secondaire** si tél. fourni — pas de filtre anti-initiales au-delà du min 3 |
| **Exemples** | `JJ` / `Jo` → refusés · `Joe` / `Léa` → OK |
| **Ange** | Partiel (voulait min 2) → **min 3** (clarification Yehya) |
| **Diable** | « JJ = pseudo valide » → **rejeté** |

Validation : compter les **lettres** (Unicode letters), pas seulement `length` brut si espaces/ponctuation — aligner client + API sur la même règle.

### (3) Quantité — **qty = 1 (V1)**

| | |
|---|---|
| **Verdict** | **1 lot / résa** forcé (UI + API ignore qty client) |
| **Ange** | Retenu |
| **Diable** | Plafond soft qty=2 → **reporté** (pas V1) |
| **Multi** | 2 lots = 2 résas si stock — pas de panier qty |

---

## Trust post-résa (point Yehya #3)

Après création réussie :

1. Écran confirmation avec code `EC-xxxx`  
2. **SMS** via **seven.io** : code EC **valide** **+** lien vers **Mes réservations**  
3. Env : `SEVEN_API_KEY` + `SEVEN_FROM` (défaut `EpicerieClb`) — commit `6590bbb`

Ce SMS est **transactionnel post-résa**, **pas** un OTP gate. Pattern C OTP reste hors chemin résa normale.

---

## Parcours MVP

`Offre → Réserver → prénom (≥3 lettres) + tél. CH requis → qty=1 → code EC + SMS conf`

---

## Ce qu’on NE fait PAS

- Remettre le tél. skippable en MVP  
- Accepter 1–2 lettres (`JJ`)  
- Sélecteur qty > 1 en V1  
- OTP à chaque résa  
- Mur identité avant le feed  

---

*Juge produit — tribunal page Réserver clos*
