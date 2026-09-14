# Débat vérif téléphone — Position ANGE (POUR)

**Contexte Épicerie Club (Villeneuve)**  
Réservation gratuite → code retrait → stock gelé à la résa → commerçant Confirmer / Refuser.  
**Proposition Yehya :** numéro → OTP SMS → puis envoi de la résa au commerçant.

**Rôle de ce doc :** défendre la confiance marketplace. Pas de verdict final (au Juge).

---

## 1. Verdict ange (recommandation, pas verdict final)

**Oui à la vérif téléphone avant la 1ʳᵉ résa (Pattern B), pas avant chaque résa.**

| Décision | Choix |
|---|---|
| Quand | **1 fois** (compte / appareil), jusqu’à changement de numéro |
| Canal | SMS OTP (pas WhatsApp en V1) |
| Digits | **6** (standard autofill iOS/Android) |
| UX | Inline, pas de page séparée |
| SMS | Le plus léger possible (voir §4) |
| Après | Numéro vérifié → résa part au commerçant |

Pattern A (OTP à chaque résa) = friction répétée injustifiée pour un panier local gratuit. Pattern B = presque toute la protection, presque zéro coût conversion au fil du temps.

---

## 2. Pourquoi Épicerie Club a besoin d’un vrai numéro

### 2.1 Qualité des résas (anti no-show / anti spam)

- La résa est **gratuite** et **bloque du stock**. Sans friction d’identité, n’importe qui (curieux, enfant, bot, test) peut geler des unités pour le commerçant.
- Un OTP prouve : *quelqu’un tient ce téléphone maintenant*. Ça coupe les numéros inventés / jetables / mal tapés.
- Analogie COD e-commerce (même logique « engagement sans prépaiement ») :
  - OTP a réduit les fausses commandes COD **~35 %** (cas D2C, COD King).
  - OTP typique : **−15–20 % RTO** ; fraude COD souvent ramenée de **8–15 % → 1–2 %** (sources §6).
  - Chez nous : équivalent = moins de `NON_RECUPEREE`, moins de stock mort, moins de « Confirmer » pour du vent.

### 2.2 Confiance commerçant (pilote Villeneuve)

- Le commerçant décide Confirmer / Refuser. Il a besoin d’un **numéro joignable**, pas d’un champ libre.
- Aujourd’hui le modèle stocke déjà `clientPhone` côté résa / inbox pro. Sans vérif, ce champ est décoratif → le commerçant perd confiance dès le 1er fantôme.
- Un numéro vérifié = le commerçant ose appeler (retard, rupture, « c’est prêt »). Sans ça, le contact magasin est théorique.

### 2.3 Anti-spam marketplace

- Offres flash + retrait local = cible idéale pour spam / flood de demandes.
- Vérif une fois = coût d’attaque (SMS + possession du téléphone) suffisant pour les bots et les farceurs, sans taxer le client récurrent.

### 2.4 Contact utile (pas seulement fraude)

Le numéro sert aussi quand tout va bien :

1. Rappel créneau / « c’est prêt »
2. Rupture ou ajustement quantité
3. Client en retard devant le magasin

Sans numéro réel, la marketplace devient un mur entre client et commerçant.

---

## 3. Contre la friction (réponse à l’Avocat du diable)

| Attaque probable | Réponse ange |
|---|---|
| « Ça tue la conversion » | Oui si OTP **mal placé** (redirect, chaque fois, SMS long). Non si **inline + Pattern B + autofill**. Sources : impact conversion souvent **&lt; 2 %** quand OTP est inline ; le gros du coût conversion vient du pattern « chaque commande ». |
| « C’est gratuit, pourquoi fricter ? » | Justement parce que c’est gratuit : sans prépaiement, la vérif **est** le signal d’engagement. |
| « WhatsApp / click-to-confirm suffit » | WhatsApp = dépendance Meta + opt-in + couverture inégale CH. Click-to-confirm ≠ preuve de possession du numéro. OK en **fallback** après échec SMS, pas en V1 primaire. |
| « 4 digits plus léger » | 4 digits = espace d’attaque trop petit + moins bon support autofill standard. **6 digits** = norm industrie + WebOTP / SMS autofill. |
| « Vérifier à chaque résa » | Sur-kill. Le risque est le **premier** faux numéro. Une fois le numéro prouvé, re-vérifier à chaque baguette = abandon inutile. |

**Trade-off assumé :** un peu de friction à la 1ʳᵉ résa, beaucoup moins de stock fantôme et de commerçants qui décrochent du pilote.

---

## 4. Design SMS — le plus léger possible

### 4.1 Texte SMS recommandé (V1)

```
Épicerie Club: 482917
```

**Règles :**

- Sender / préfixe marque court
- **Code seul** (6 chiffres)
- Pas de lien
- Pas d’emoji
- Pas de marketing
- Pas de « ne partagez pas ce code » (bruit ; le code expire vite)

Variantes acceptables (si opérateur / légal impose un minimum) :

| Rang | Texte | Quand |
|---|---|---|
| 1 (reco) | `Épicerie Club: 482917` | Défaut |
| 2 | `482917 — ton code Épicerie Club` | Si le préfixe marque n’est pas fiable |
| 3 | `Épicerie Club: 482917 pour confirmer` | Si contrainte légale « objet » |

### 4.2 Paramètres techniques légers

| Param | Valeur |
|---|---|
| Longueur | 6 digits numériques |
| TTL | 5 min |
| Resend | après 30–45 s, max 3 |
| Autofill | `autocomplete="one-time-code"` + WebOTP si dispo |
| Placement | **Inline** sur l’écran résa (pas de redirect) |
| Pattern | **B — 1ʳᵉ fois** ; skip si `phoneVerifiedAt` présent et numéro inchangé |
| Re-vérif | Seulement si le client change de numéro |

### 4.3 Pourquoi pas WhatsApp en V1

- SMS marche sans app / sans opt-in conversationnel
- Couverture CH simple pour un pilote Villeneuve
- WhatsApp = canal de **relance commerçant → client** plus tard, pas le gate de confiance initial

### 4.4 Parcours client (léger)

1. Client tape son numéro (CH, format normalisé)
2. Tap « Recevoir le code » → SMS ultra-court
3. Champ OTP inline → autofill → validation
4. `phoneVerified` = true → bouton Réserver envoie la demande
5. Commerçant voit nom + **numéro vérifié** + code retrait

Résas suivantes : numéro prérempli, **pas d’OTP**, sauf changement de numéro.

---

## 5. Ce qu’on mesure (pour trancher avec des preuves)

Après release pilote, suivre 2 semaines :

1. **Taux complétion OTP** (SMS envoyé → OTP OK)
2. **Abandon à l’étape OTP** vs abandon sans OTP (A/B si possible)
3. **% résas NON_RECUPEREE** avant / après
4. **% résas refusées** commerçant « client injoignable »
5. **Appels commerçant → client** réussis
6. Coût SMS / résa réussie

Critère ange de succès : baisse nette des fantômes **sans** chute &gt; ~2–3 pts du funnel 1ʳᵉ résa.

---

## 6. Sources / recherches utiles

- COD King — OTP a réduit les fausses commandes COD ~35 % (cas D2C) : https://codking.tech/otp-verification-reduced-fake-orders-by-35/
- BotSpace — OTP : −15–20 % RTO ; trade-off typique −5–8 % commandes confirmées vs −15–25 % RTO : https://www.bot.space/blog/what-is-cod-verification-ecommerce
- EasySell — OTP ramène souvent la fraude COD de 8–15 % à 1–2 % ; vérifier tout le monde = taxe conversion inutile → vérifier le risque / une fois : https://easysellapp.com/blogs/wiki/risk-based-cod-verification-stop-checking-every-order
- Releasit — OTP **inline** : impact conversion souvent &lt; 2 % ; le redirect tue la conversion : https://www.releas.it/blogs/news/otp-verification-shopify-cod
- Koder.ai — 6 digits, TTL 5 min, resend 30–45 s, max 3 ; ne pas OTP-iser les clients déjà fiables : https://koder.ai/blog/cash-on-delivery-confirmation-rto

*Note : sources surtout COD e-com Inde/Shopify. Transposition Épicerie Club = même mécanique « engagement sans prépaiement + coût opérationnel si faux » ; calibrer avec nos métriques Villeneuve.*

---

## 7. Synthèse pour le Juge

**POUR** numéro → OTP SMS → résa, **à condition que** :

1. Pattern **B** (1 fois, pas chaque résa)
2. SMS **minimal** (`Épicerie Club: 482917`)
3. UX **inline + autofill + resend**
4. 6 digits, TTL court
5. Objectif explicite : numéro **joignable** pour le commerçant + stock non gaspillé

Ce n’est pas de la friction gratuite. C’est le prix bas d’une marketplace de confiance à Villeneuve.
