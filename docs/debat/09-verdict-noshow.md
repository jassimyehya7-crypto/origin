# Verdict juge — No-show + SMS progressifs + ban 7j

**Dossier :** `07-diable-noshow.md` + `08-ange-noshow.md`  
**Préalable :** Pattern C (`03`) · soft profile (`06`) · téléphone skippable · SMS seulement si risque *prouvé*  
**Critère :** réserver simple, pas barbant ; discipline stock **sans** police d’inférence ; un seul rail de risque.

---

## 0) Erreurs de raisonnement (strict)

| Erreur | Pourquoi c’est faux | Sanction |
|---|---|---|
| « Pas de scan Pro = no-show client » | Le scan est un **geste Pro** (rush, tablette au fond, Wi-Fi, 1er mardi). Mesure la compliance magasin, pas l’honneur client. | **Interdit** en V1 |
| Auto-`NON_RECUPEREE` → Pattern C pour tout le quartier | `phone-risk.ts` incrémente déjà au `NON_RECUPEREE`. Brancher l’auto = **Pattern B dès J1**. | Contredit `03` |
| SMS « d’autres auraient pu en bénéficier » | Culpabilité, pas transactionnel ; LCD/LPD gris ; dark pattern. | **Copy interdite** |
| « Sans n° on ne peut pas discipliner → n° obligatoire » | Le **blocage** vit sur soft user id. Le SMS est un canal de *prévenir*, pas la condition d’exister la règle. | Contredit `03`/`06` |
| Deuxième échelle parallèle mal branchée | OTP Pattern C **et** SMS/ban sur le *même* faux positif = double peine + support. | Un seul compteur de strikes **prouvés** |
| Designer depuis `cancelExpiredConfirmed()` démo | Raccourci seed local, pas spec. | Comme Marie Dupont : **théâtre ≠ produit** |

**Arbitrage Ange vs Diable :** Ange gagne la *besoin de discipline progressive* et le chemin sans n°. Diable gagne le *déclencheur* : pas de no-show sans preuve humaine.

---

## 1) Comment détecter le no-show

### Règle V1 (verdict)

`NON_RECUPEREE` **uniquement** si le Pro (ou un override fondateur rare) déclare **« Pas venue »**.

| Situation fin de fenêtre | Statut | Strike ? | Stock |
|---|---|---|---|
| `CONFIRMEE`, Pro tape **Récupérée** (scan / saisie code / tap ligne) | `RECUPEREE` | Non | OK |
| `CONFIRMEE`, Pro tape **Pas venue** | `NON_RECUPEREE` | **Oui** | Restauré |
| `CONFIRMEE`, **aucun** geste Pro à la clôture | `EXPIREE` (ou `CLOTUREE_INCONNUE`) | **Non** | Restauré |
| `EN_ATTENTE` jamais confirmée | reste / `EXPIREE` — **pas** no-show | Non | Restauré si gelé |
| Client annule / Pro refuse | `ANNULEE` / `REFUSEE` | Non | Restauré |

### Garde-fou « Pro oublie de scanner »

1. **Job fin de journée** (fermeture shop ou bouton fondateur « Clôturer ») : produit une liste Pro  
   `Codes non scannés ce soir (N)` → pour chaque ligne, **2 taps** : **Récupérée** / **Pas venue**  
2. **Défaut si le Pro ignore la liste** : `EXPIREE` (stock rendu, **zéro** strike) — pas `NON_RECUPEREE`  
3. **Correctif 24 h** : Pro peut reclasse `NON_RECUPEREE` → `RECUPEREE` (erreur de tap) → **retire le strike** et annule SMS encore en queue  
4. Marge humaine optionnelle : clôture à **fermeture + 30 min** pour laisser le dernier client / le dernier scan

### Ce que le fondateur « voit »

Une file « confirmées non scannées » ≠ file « no-shows ».  
Le cockpit distingue clairement :

- **À trancher (Pro)** : `CONFIRMEE` sans scan  
- **No-shows déclarés** : `NON_RECUPEREE`  
- **Expirées sans faute** : `EXPIREE`

---

## 2) Escalade 1 / 2 / 3 exacte

**Compteur :** strikes = `NON_RECUPEREE` **déclarées Pro**, rattachées au soft user id (et n° si présent).  
**Fenêtre :** 90 jours glissants.  
**Plafond :** **1 strike max / jour civil** (oubli groupé ≠ 3 strikes).  
**Un seul rail** avec Pattern C (pas une 2ᵉ police).

### Niveau 1 — 1er strike (oubli possible)

| | |
|---|---|
| **In-app** | Bannière : `Résa non retirée — stock rendu au magasin.` |
| **SMS** (si n° présent) | `Épicerie Club: résa non retirée — stock rendu au magasin.` |
| **SMS** (si n° absent) | Aucun — même copy in-app + nudge « Ajoute un n° pour les rappels » |
| **Réservation** | Toujours possible |
| **Pattern C** | Oui : OTP avant prochaine résa **si** n° présent (`03`) |
| **Copy interdite** | « d’autres auraient pu », leçons morales, marketing |

### Niveau 2 — 2e strike / 90 j

| | |
|---|---|
| **In-app** | Modal une fois : `2e résa non retirée. Encore une = pause 7 jours.` + « J’ai compris » |
| **SMS** (si n°) | `Épicerie Club: 2e résa non retirée. Encore une = pause 7 jours.` |
| **Réservation** | Possible (+ OTP Pattern C si n°) |
| **Pro** | Badge interne optionnel « historique fragile » — **pas** visible client |

### Niveau 3 — 3e strike / 90 j

| | |
|---|---|
| **In-app** | Mur à la résa jusqu’à date +7 j |
| **SMS** (si n°) | `Épicerie Club: 3 résas non retirées. Pause jusqu’au [date]. Après, tu pourras réserver à nouveau.` |
| **Blocage** | **Pause résa 7 jours** sur soft user id **et** n° si présent (device id en renfort anti-contournement léger V1) |
| **Sortie** | Auto à J+7 ; compteur repasse à **1** (sous surveillance), pas à 0 |
| **Pas** | Ban à vie, doxxing, sermon |

### Rappel *avant* (P2, pas V1 discipline)

SMS/push « tu as jusqu’à 19h, code EC-xxxx » = **opt-in**, transactionnel, *avant* la fin de fenêtre. Utile. **Hors** échelle punitives. Justifier le coût plus tard.

---

## 3) Téléphone : skippable forever ?

| Moment | Règle |
|---|---|
| 1ʳᵉ résa / soft profile | **Skippable** — inchangé (`06`) |
| Après strike sans n° | Nudge fort, **toujours skippable** |
| Pour envoyer SMS 1/2/3 | N° requis *pour le canal* — **pas** pour appliquer pause / OTP rail soft id |
| Mur « n° obligatoire sinon pas de résa » | **Non** en V1 |
| Forcer le n° « pour que l’automate marche » | **Non** |

**Chemin sans n° (retenu Ange §5.3) :**

| Strike | Action |
|---|---|
| 1 | In-app seulement + flag soft id |
| 2 | Modal « J’ai compris » + nudge n° |
| 3 | **Même pause 7 j** via soft user id |

Les deux chemins convergent. On ne punit **pas** plus fort ceux qui ont donné un n°.

---

## 4) Fondateur vs Pro

| Acteur | Voit / fait |
|---|---|
| **Pro** | Inbox live ; scan / « Récupérée » ; liste clôture « non scannés » → Récupérée / Pas venue ; correctif 24 h ; **n’envoie pas** les SMS discipline |
| **Fondateur** | KPIs : taux scan Pro (`RECUPEREE`/`CONFIRMEE`), no-shows **déclarés**, `EXPIREE` sans geste, distribution strikes 1/2/3, % n° au strike, faux positifs corrigés ; peut forcer clôture journée ; override rare |
| **Plateforme** | Applique statuts par défaut `EXPIREE` ; incrémente strikes **seulement** sur déclaration ; enqueue SMS ; applique pause 7 j |

Le commerçant dit la vérité en un tap. La plateforme protège le réseau. Le fondateur **mesure**, il ne sermon pas à la main.

---

## 5) Ce qu’on NE fait PAS

1. **Pas** de cron : absence de scan → `NON_RECUPEREE` → SMS  
2. **Pas** de copy « d’autres auraient pu en bénéficier »  
3. **Pas** de téléphone obligatoire pour « faire marcher » la ladder  
4. **Pas** de strike sur `EN_ATTENTE` / `EXPIREE` / refus / annulation  
5. **Pas** de ban 7 j sur inférence  
6. **Pas** de 2ᵉ système de risque parallèle à Pattern C (même compteur)  
7. **Pas** de SMS quotidiens / nag  
8. **Pas** de productiser `cancelExpiredConfirmed()` sans garde-fou Pro  
9. **Pas** d’escalade SMS avant d’avoir le **taux de scan Pro** (baseline 2 semaines)  
10. **Pas** de confondre file fondateur « non scanné » et « no-show »

---

## 6) Implémentation V1 (sans Twilio si besoin)

### Données

| Entité | Champs utiles |
|---|---|
| Soft user (déjà `06`) | `id`, prénom, phone?, `strikes_90d`, `paused_until?` |
| Reservation | statuts + `closed_reason`: `SCAN` / `PRO_NOSHOW` / `EXPIRED_UNKNOWN` / … |
| `phone-risk.ts` | Étendre : strikes sur soft user id ; `recordNoShow` **seulement** si `PRO_NOSHOW` ; `isPaused(softUserId)` |
| `sms_outbox` | `id`, to, body, level(1\|2\|3), reservation_id, status(`queued`\|`sent`\|`cancelled`\|`stubbed`), created_at |

### Jobs / API

1. `POST /api/shops/[id]/close-day` (ou cron fermeture +30) → liste non scannées ; si timeout sans réponse Pro → `EXPIREE`  
2. `PATCH` résa : `RECUPEREE` | `NON_RECUPEREE` (Pro) avec auth Pro  
3. Sur `NON_RECUPEREE` déclaré → `recordNoShow` → enqueue SMS niveau si n° → si strike≥3 set `paused_until`  
4. Guard `createReservation` : si `paused_until > now` → 403 + message date  
5. Correctif 24 h : `NON_RECUPEREE` → `RECUPEREE` retire strike + `sms_outbox` cancel si `queued`

### SMS sans Twilio (V1)

- Writer **queue + stub** : log / table `sms_outbox` status `stubbed`  
- Fondateur voit la queue (corps, niveau, destinataire masqué partiel)  
- Branche Twilio Verify/SMS plus tard derrière la même outbox (feature flag)

### UI minimale

- Pro : bouton **Clôturer / Non scannés** + 2 taps  
- Client : bannière / modal / mur pause  
- Fondateur : 3 compteurs (scan rate, no-shows déclarés, expirées inconnues)

### Ordre de build

1. Statuts `EXPIREE` + clôture Pro 2 taps (bloque les faux strikes)  
2. Strikes soft user + pause 7 j **sans** SMS  
3. Outbox stub + copies niveau 1/2/3  
4. Twilio quand le taux de scan Pro est sain (≥ à définir après 14 j ; si scan rate &lt; ~70 %, **interdire** tout envoi auto même stub→live)

---

## 7) Critères de succès (14 jours)

| Métrique | Cible / alerte |
|---|---|
| Taux scan Pro (`RECUPEREE` / `CONFIRMEE`) | Suivi ; si **&lt; 70 %** → pas d’activation SMS live |
| `NON_RECUPEREE` déclarées / `CONFIRMEE` | Alerte si **&gt; 15 %** (déjà `03`) |
| % `EXPIREE` (sans geste) / `CONFIRMEE` | Suivi = dette UX Pro, **pas** KPI client |
| Faux positifs corrigés &lt; 24 h | Doit rester possible et mesuré |
| Abandon 1ʳᵉ résa | Ne doit **pas** bouger à cause de cette feature |

---

## 8) Synthèse actionnable

1. **No-show = déclaration Pro**, jamais l’absence de scan seule  
2. Défaut fin de journée sans geste = `EXPIREE` (stock rendu, 0 strike)  
3. Escalade 1/2/3 **sur strikes prouvés** : in-app + SMS factuel si n° ; pause 7 j au 3e  
4. Téléphone **reste skippable** ; pause via soft id  
5. Pattern C OTP reste le challenge à la *prochaine* résa après strike ≥ 1 (si n°)  
6. V1 : clôture Pro + strikes + outbox stub — Twilio plus tard

---

*Juge produit — Épicerie Club*  
*Sources : `07-diable-noshow.md`, `08-ange-noshow.md`, `03-verdict-juge.md`, `06-verdict-compte.md`, `phone-risk.ts`*
