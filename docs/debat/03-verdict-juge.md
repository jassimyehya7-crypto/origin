# Verdict juge — Vérif téléphone / OTP avant réservation

**Dossier :** `01-diable.md` (y compris addendum §8) + `02-ange.md`  
**Contexte :** OffresLocal Villeneuve — résa gratuite, code retrait, stock déduit à la résa, fin de journée, Pro mobile, Supabase Realtime, risque abandon « trop compliqué ».  
**Critère de jugement :** parcours client le plus simple possible, pas barbant ; confiance commerçant ; preuves, pas croyances.

---

## 1) Verdict clair

### **Risk-based (Pattern C) — pas d’OTP à l’entrée du pilote.**

| Question | Décision |
|---|---|
| OTP à chaque résa (Pattern A) | **Non** |
| OTP à la 1ʳᵉ résa / compte (Pattern B) | **Non en V1 pilote** |
| Risk-based (Pattern C) | **Oui — verdict** |
| Autre | Numéro **demandé** (non vérifié) avec raison claire ; OTP seulement si risque |

**En une phrase :** on ne fait pas payer un 2FA SMS à chaque curieux en rayon ; on protège le stock et le commerçant avec des règles métier, et on réserve l’OTP SMS aux cas où le risque est déjà prouvé.

**Addendum Diable §8 (retenu) :** les « &lt; 2 % » = claims vendeurs CoD, pas preuve CH ; Baymard chiffre la friction téléphone ; SMS CH ≈ CHF 0,10–0,12 / succès ; **zéro** étude OTP → −no-show grocery ; LCD/LPD = téléphone client vérifié **non obligatoire** → proportionnalité = Pattern C, pas péage.

---

## 2) Parcours exact

### Client (V1 pilote — sans OTP à l’entrée)

1. Feed / QR magasin → ouvre l’offre  
2. Choisit la quantité  
3. **Téléphone demandé** avec raison (« pour que le commerce t’appelle si besoin ») — normalisé ; CH + intl soft ; **pas** de mur `+41` only  
4. Si le client refuse le n° : résa **quand même** possible → Pro voit badge « sans téléphone » (Baymard : 14 % refus net du n° ; mieux un vrai sans-n° qu’un faux n°)  
5. Tap **Réserver** → résa créée **immédiatement** → stock gelé → code retrait `EC-xxxx` à l’écran  
6. Statut `EN_ATTENTE` jusqu’à Confirmer / Refuser Pro  
7. Résas suivantes : numéro prérempli si fourni, **toujours sans OTP** sauf déclencheur risque (§2.3)

### Commerçant (Pro mobile)

1. Inbox Realtime : nouvelle demande (nom / pseudo + téléphone **ou** badge « sans téléphone » + qty + offre)  
2. **Confirmer** ou **Refuser** (une action)  
3. Si numéro présent : **appeler** si besoin (retard, rupture, « c’est prêt »)  
4. Au retrait : scanner / saisir le code → `RECUPEREE`  
5. Si no-show : `NON_RECUPEREE` → stock restauré + signal risque côté client

### 2.3 Déclencheurs OTP (Pattern C) — quand le SMS arrive enfin

OTP SMS **inline** exigé **avant la prochaine résa** si **au moins un** :

| Déclencheur | Seuil V1 |
|---|---|
| `NON_RECUPEREE` | ≥ 1 sur le même numéro / appareil |
| Commerçant marque « injoignable » | 1 signalement |
| Flood | ≥ 3 demandes en 10 min, ou > 1 résa active (règle déjà prévue) |
| Changement de numéro | Nouveau numéro non encore « clean » après un historique à risque |

Après OTP OK : flag `phoneVerifiedAt` ; les résas suivantes skippent l’OTP **tant que** le numéro ne change pas et qu’aucun nouveau déclencheur ne tombe.

### 2.4 Escalade P2 (si les métriques le forcent)

Si après 2 semaines pilote : `NON_RECUPEREE` élevé **et** commerçants qui décrochent **malgré** limites + historique → alors seulement :

- soit Pattern B **après le 1er retrait réussi** (vérifier qui a déjà prouvé ses pieds),  
- soit prépaiement (déjà prévu dossier) — vrai engagement, pas théâtre SIM.

On **n’ouvre pas** Pattern B « 1ʳᵉ résa » pendant le cold start : là, Pattern B = Pattern A (argument Diable §2.1 — retenu).

---

## 3) Longueur OTP + canal (quand Pattern C se déclenche)

| Param | Verdict |
|---|---|
| Canal | **SMS** (pas WhatsApp en V1 ; WhatsApp = relance « c’est prêt » plus tard, pas gate) |
| Digits | **6** (autofill iOS/Android / WebOTP) |
| UX | **Inline** obligatoire — zéro redirect, zéro page séparée |
| TTL | **5 min** (Ange) ; UI resend dès **30–45 s**, max 3 |
| SMS | Format compatible autofill (domaine / WebOTP) — **prioritaire** sur le SMS ultra-court marketing. Si conflit : on sacrifie la poésie, pas l’autofill (Diable §2.8 retenu) |
| Exemple | `482917 is your OffresLocal code` + domain bound selon stack SMS |
| Email | **Pas** de canal OTP V1 |
| 4 / 5 chiffres | **Non** — 4 = sécurité théâtre + moins bon autofill ; débat inutile pour du pain |

Hors Pattern C : **aucun SMS OTP**. SMS transactionnel « c’est prêt / 20 min » = sujet séparé, à justifier économiquement (Twilio CH ≈ USD 0,0769/SMS — Diable §2.6).

---

## 4) Ce qu’on NE fait PAS

1. **Pas** d’OTP avant que la résa existe (péage d’identité sur baguette gratuite)  
2. **Pas** d’OTP à chaque résa  
3. **Pas** d’OTP « 1ʳᵉ fois » pendant le pilote cold start (mythe « Pattern B ≈ 0 »)  
4. **Pas** de gel de stock *pendant* l’attente SMS (crée des fantômes OTP)  
5. **Pas** de double promesse confuse : après résa = `EN_ATTENTE` claire, pas « c’est réservé » tant que Pro n’a pas confirmé  
6. **Pas** WhatsApp comme gate V1  
7. **Pas** mur pays `+41` only (touristes lac / camping)  
8. **Pas** signup forcé « pour skip OTP plus tard » au moment du tap Réserver  
9. **Pas** d’analogie COD Inde comme preuve de conversion Villeneuve (catégorie différente — Diable §2.3)  
10. **Pas** de généralisation OTP sans A/B / métriques §5  
11. **Pas** de traiter les claims « &lt; 2 % abandon OTP » CoD Inde comme preuve Villeneuve  
12. **Pas** d’OTP « parce que LCD / confiance » — LCD n’exige pas le téléphone client vérifié ; LPD = minimisation

---

## 5) Critères de succès (taux complétion résa)

### Objectif primaire (V1 sans OTP entrée)

| Métrique | Cible 2 semaines pilote |
|---|---|
| **Complétion résa** : tap Réserver → résa créée | **≥ 92 %** |
| Taux fourniture n° (opt-in téléphone) | Suivi ; alerte si &lt; **70 %** avec explication affichée (proxy Baymard) |
| Funnel : résa créée → confirmée Pro | Suivi (pas de cible OTP) |
| Funnel : confirmée → `RECUPEREE` | Baseline à établir ; alerte si `NON_RECUPEREE` **> 15 %** des confirmées |
| 1 résa active max | 100 % respect règle |

### Si / quand OTP Pattern C se déclenche

| Métrique | Cible |
|---|---|
| Complétion OTP (SMS envoyé → OK) | **≥ 80 %** (réf. SMS auth ~80 % — cabinet) ; si &lt; 70 % → revoir delivery / autofill / TTL |
| Abandon additionnel dû à l’OTP | **&lt; 5–8 pts** sur le sous-segment « à risque » (acceptable : on taxe les risqués, pas le quartier) |
| Coût SMS / résa réussie post-OTP | Suivi (succès + abandons + resends) |

### Preuves cabinet retenues (arbitrage)

| Chiffre | Usage dans le verdict |
|---|---|
| OTP **chaque tx** : **5–15 %** drop | Motive le **non** au Pattern A |
| Pattern B long terme ≈ **0** | Vrai pour récurrents — **faux** au cold start Villeneuve → pas Pattern B V1 |
| SMS auth ~**80 %** complétion | Budget perte **~20 %** dès qu’on challenge — donc challenge **rare** et justifié |
| OTP **inline** obligatoire | Condition *sine qua non* si OTP un jour ; sinon on sort du best case &lt; 2 % |

### Ce que Ange gagne / Diable gagne

| Ange (retenu) | Diable (retenu) |
|---|---|
| Besoin d’un **numéro joignable** (demandé + expliqué) | Pas d’OTP entrée ; cold start = toutes 1ʳᵉ fois ; Baymard / LPD / CHF SMS |
| 6 digits + inline + autofill **quand** OTP | Analogie COD surévaluée ; course au stock pendant OTP |
| Anti-spam / anti-fantôme comme objectif | Pattern C + limites + historique avant 2FA |
| SMS pas WhatsApp en V1 | Docs internes : valeur avant compte ; SMS si justifié |

**Synthèse ange vs diable :** la confiance commerçant se joue d’abord sur **joindre + discipline no-show**, pas sur un péage SIM. L’OTP reste dans la boîte à outils — **après preuve de risque**, pas avant la première baguette.

---

## 6) Décision d’implémentation (actionnable produit)

1. Garder / rétablir le parcours **qty → téléphone (expliqué, skippable) → Réserver → code écran** (sans étape OTP)  
2. Afficher au Pro : **« sans téléphone »** / **« non vérifié »** / **« vérifié »** (après Pattern C)  
3. Brancher les déclencheurs §2.3 → écran OTP inline 6 chiffres SMS  
4. Instrumenter le funnel §5 **avant** tout débat de généralisation  
5. Revenir devant le Juge à J+14 avec chiffres — pas avec opinions

---

*Juge produit — OffresLocal*  
*Fichiers sources : `docs/debat/01-diable.md`, `docs/debat/02-ange.md`*

---



---

## Amendement (addendum Diable §8)

Relu le 13 sept. 2026. **Verdict Pattern C inchangé.** Ajustements :

1. Téléphone = **demandé + expliqué**, plus « obligatoire mur » (Baymard 14 % refus ; faux n° pire que vide)  
2. Preuve « &lt; 2 % » déclassée (claim vendeur)  
3. Coût SMS CH rappelé (Twilio ≈ CHF 0,10 ; Swisscom H CHF 0,12)  
4. Base légale : OTP client **non exigé** LCD/LPD → renforce le non au péage  
5. Anti-no-show prouvé = prépaiement / discipline, **pas** OTP (aucune étude grocery/TGTG)

## Annexe — recherches complémentaires (post-verdict)

Confirmations (ne changent pas le verdict) :

- OTP chaque tx : **−5 à −15 %** (MessageCentral / fourchette cabinet)
- SMS Verify : complétion typique **~68–86 %** selon marché ; « ~80 % » = complétion, pas délivrabilité (Twilio)
- Inline + WebOTP + un seul champ : obligatoire (web.dev / Twilio)
- **6 digits** standard ; **4** = code retrait in-app, pas auth SMS ; **5** à éviter
- Risk-based / step-up (Stripe Radar, Auth0) : challenge seulement si risque — aligne Pattern C
- OTP ne règle pas le no-show same-day → réputation / limite / dépôt

Sources : messagecentral.com/blog/otp-api-for-ecommerce · baymard checkout UX · Okta Customer Identity 2025 · twilio.com/verify · web.dev/sms-otp-form · docs.stripe.com/radar/risk-settings
