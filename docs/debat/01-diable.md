# Débat vérif téléphone — Position DIABLE (CONTRE)

**Contexte Épicerie Club (Villeneuve)**  
Réservation gratuite → code retrait → stock gelé à la résa → commerçant Confirmer / Refuser.  
**Proposition Yehya :** le client entre un numéro → OTP SMS (4/5/6 chiffres) → *seulement ensuite* la résa part au commerçant.

**Rôle de ce doc :** attaquer cette idée. Pas de verdict final (au Juge).

Les chiffres « cabinet » utilisés ici : OTP inline bien fait &lt; 2 % d’abandon vs 5–15 % si OTP à chaque transaction ; SMS auth ~80 % de complétion (~20 % de perte) ; Pattern B (OTP à la 1ʳᵉ fois / compte) ≈ 0 impact conversion *sur le long terme* ; Pattern C risk-based recommandé ; OTP inline, autofill, resend visible, expiry 90–120 s.

---

## 1. Ce que je combats

Un péage d’identité **avant** qu’une résa existe. Pas « un SMS un jour, peut-être ». Le moment attaqué : le client a déjà choisi l’offre et la quantité. On lui demande une preuve SIM pour une baguette gratuite à réserver.

L’adoucissement Pattern B (OTP seulement à la 1ʳᵉ résa) ne sauve pas le pilote. Voir §2.1.

---

## 2. Douze arguments contre

### 2.1 Le pilote n’est fait que de premières fois

Pattern B « ≈ 0 impact conversion » est un argument de produit mature : les récurrents skippent l’OTP. À Villeneuve, au lancement, **presque chaque client est une 1ʳᵉ fois** (QR en magasin, pas de compte). Pattern B = Pattern A pendant tout le cold start.

Le dossier le dit : sans clients, les commerçants ne publient pas. Tuer la 1ʳᵉ résa tue la marketplace. Le « 0 impact plus tard » ne paie pas les 8 premières semaines.

### 2.2 20 % de perte, pas 2 %

Les recherches cabinet donnent deux ordres de grandeur. Il ne faut pas les mélanger.

| Chiffre | Ce qu’il mesure | Ce qu’il ne mesure pas |
|---|---|---|
| SMS auth ~80 % complétion | ~20 % des gens qui reçoivent un challenge SMS ne finissent pas | Un checkout déjà engagé, un compte existant |
| OTP inline &lt; 2 % | Best case d’un OTP *bien* collé dans un checkout CoD (souvent après panier, souvent au-dessus d’un seuil de panier) | Un QR flash, résa gratuite, 1ʳᵉ visite |
| 5–15 % | OTP à chaque transaction | — |

Yehya place l’OTP **avant que la résa parte**. C’est le seau 20 % / 5–15 %, pas le seau &lt; 2 %. Et le &lt; 2 % lui-même est un **claim vendeur CoD Inde** (Releasit, Message Central), sans méthodo publique — inutilisable pour Villeneuve.

Ce qui est mesuré, c’est le **téléphone et le compte**, pas l’OTP flash :

- **14 %** des internautes US ne donneraient **jamais** leur n° à un site e-commerce (Baymard, n=1 026, maj. 29 jul. 2025)
- **&gt; 70 %** réticents à donner un n° (Baymard checkout UX, nov. 2024 / maj. 25 nov. 2025)
- **18 %** ont déjà abandonné parce que le site voulait un **compte** (Baymard, liste abandon, 22 sept. 2025)
- **17 %** parce que le checkout était trop long / trop compliqué (même)
- **39 %** des sites exigent un n° **sans explication** — et les gens tapent des faux (9999). Un n° forcé non expliqué est opérationnellement mort.

Aucun Baymard / Twilio / Stytch / Auth0 / Amplitude ne publie un taux d’abandon OTP *avant résa d’offre flash* CH ou EU. Trou dur. On n’a pas le droit de le remplir avec un blog Shopify CoD.

### 2.3 L’analogie COD Inde est une erreur de catégorie

Les sources « OTP −35 % de fausses commandes / −15–20 % RTO / fraude 8–15 % → 1–2 % » viennent du cash-on-delivery e-commerce (Inde, Shopify). Là, un faux ordre = logistique aller-retour, encaissement raté, parfois des centaines de roupies.

Chez nous, un fantôme = un croissant gelé deux heures, et le commerçant a **déjà** Confirmer / Refuser. Le coût unitaire n’est pas le même. Transposer le taux de fraude COD comme si Villeneuve était Mumbai, c’est de la rhétorique.

EasySell (cité pour le POUR) dit d’ailleurs de **ne pas** vérifier tout le monde — c’est Pattern C, pas le péage d’entrée.

### 2.4 Course au stock pendant l’OTP

Règle produit : le stock gèle **à la résa**. L’OTP est **avant** la résa.

- Pendant que le client attend le SMS, le dernier item part. Il a fait l’exercice pour un « épuisé ».
- Si on gèle le stock *pendant* l’OTP : les abandons (20 %, ou 5–15 %) bloquent du vrai stock pour du vent — exactement le mal qu’on prétend soigner.

Les deux branches sont mauvaises. Le gate crée le problème qu’il vend comme solution.

### 2.5 Double gate : OTP + Confirmer / Refuser

Le client prouve son SIM, *puis* attend le commerçant. S’il refuse, l’OTP n’a servi à rien pour le client. S’il confirme toujours, le Confirmer est du théâtre.

Deux serrures sur une résa gratuite. UX barbante, promesse floue (« c’est réservé » — non, c’est *demandé*, après un examen).

### 2.6 Coût SMS Suisse — on paie aussi les abandons

Twilio, tarif public CH : **USD 0,0769 / segment** vers +41. Twilio Verify : **+ USD 0,05** par succès. USD/CHF ≈ 0,815 (12 sept. 2026) → **≈ CHF 0,063 le SMS**, **≈ CHF 0,10 la vérif réussie** (0,05+0,0769). Bird : USD 0,070 / segment. **Swisscom Web-to-SMS niveau H (volume pilote)** : **CHF 0,12 / SMS** HT, facture min. CHF 100, setup short ID CHF 500. WhatsApp auth template Europe de l’Ouest : **€ 0,0142** (barème Meta 1er jan. 2026) — 3× moins cher que le SMS CH, et on n’en a pas besoin non plus à l’entrée.

Facturation **par segment**. Un texte FR avec accents peut passer UCS-2 (70 car.) → **×2**.

Ça n’inclut pas :

- le SMS des gens qui abandonnent (envoyé, jamais converti)
- les renvoyés (resend visible = resend facturé ; 2–3 essais = CHF 0,20–0,25)
- le SMS failed (petit fee Twilio, plus le client perdu)
- un 2ᵉ segment si on allonge le texte « pour confirmer / ne partagez pas »

L’archi interne : « SMS seulement si économiquement justifié ». Personne n’a justifié. Le dossier liste déjà « coût des notifications / SMS » dans les unit economics. À 500 1ʳᵉ visites pilote : ~CHF 50 de succès + la facture des 20 % morts + les resends. L’argent est petit. La conversion perdue ne l’est pas.

### 2.7 Delivery fail = « nan laisse tomber »

Villeneuve : client en rayon, QR scanné, offre flash, stock qui tourne. Le SMS met 20–40 s, tombe en spam A2P, arrive sur l’autre SIM, ou jamais (roaming, DND, filtre iMessage).

Expiry cabinet : **90–120 s**. Le client ouvre Messages, revient, le champ a expiré. Resend. Deuxième attente. Il pose le téléphone et **achète le croissant au comptoir**. On a perdu l’attribution, l’habitude, et on a payé le SMS.

C’est ça « nan laisse tomber ». Pas une théorie UX. Un humain debout devant le pain.

### 2.8 Autofill et SMS « le plus léger » s’annulent

Pour coller au &lt; 2 %, il faut autofill. iOS/Android WebOTP veulent un SMS **formé pour le domaine**, pas `Épicerie Club: 482917`. Le SMS minimal (sans domaine, sans format origin-bound) **casse** l’autofill. Le SMS compatible autofill est plus long = risque 2 segments = coût × 2, et plus de copie manuelle s’il échoue.

On ne peut pas vendre en même temps : SMS ultra-court *et* impact conversion &lt; 2 %. Choisir l’un, perdre l’autre.

4 vs 5 vs 6 chiffres : débat de banque pour une résa à CHF 0. 6 chiffres = plus de fautes dès que l’autofill rate. 4 chiffres = sécurité théâtre. Le débat lui-même est le symptôme : on design un 2FA au lieu d’une résa.

### 2.9 Vos docs internes disent déjà non

- Produit : « montrer la valeur avant le compte », « faire de la réservation l’action la plus rapide ».
- Architecture MVP : « SMS seulement si économiquement justifié ».
- Dossier risques no-show : **code de retrait, historique, limites, éventuellement prépaiement plus tard**. Pas un OTP.
- Checklist LPD : minimisation. Un téléphone *vérifié* n’est pas nécessaire pour tenir une baguette.
- Audit UX (app principale) : parcours actuel = **1 décision / écran — OK**. L’OTP le casse.
- Copy : « Couper tout ce qui n’aide pas à réserver ou retirer. »

L’app principale réserve déjà sans OTP (qty → Réserver → ticket). Le prototype brand a ajouté numéro + code 4 chiffres (4827 en dur). C’est du théâtre, pas une preuve que ça convertit.

### 2.10 Collecter ≠ vérifier

« Le commerçant doit pouvoir appeler » : un champ téléphone suffit. L’OTP ne rend pas le client plus poli au retrait. Il prouve une SIM, pas une venue.

« Sans vérif le champ est décoratif » : faux. Un numéro mal tapé se voit au 1er appel. Le commerçant marque injoignable. *Ensuite* on peut exiger un OTP (Pattern C). Taxer 100 % des 1ʳᵉ visites pour le 1 % de numéros fantaisie, c’est le mauvais ratio.

LPD : on n’a pas le droit moral (ni le besoin légal) de transformer une résa gratuite en enrôlement d’identité.

### 2.11 Dark pattern, pas de la « confiance »

« Recevoir le code de vérification » a l’air d’une confirmation. C’est un gate. Le client a déjà décidé. On lui vend une preuve d’identité pour une résa **annoncée gratuite, sans paiement**.

Le prototype brand refuse les numéros non-CH (`+41` ou `0…`). Villeneuve est une ville de lac : +33 / +49 au camping, à la gare, au bord de l’eau. On jette le touriste avant le SMS.

Ajouter un compte « pour plus tard skip OTP » pousse un signup au pire moment. C’est le contraire du principe produit.

### 2.12 Le no-show a déjà un traitement, moins cher

Un OTP ne réduit pas les no-shows des gens *réels* qui ont tapé un vrai numéro et n’ont pas bougé. Too Good To Go a des comptes vérifiés et des no-shows. L’identité ≠ l’honneur.

Ce qui marche, déjà écrit dans le dossier :

1. Code de retrait à l’écran (existe)
2. 1 résa active à la fois
3. Historique + limite après `NON_RECUPEREE`
4. Rappel « c’est prêt » (push / email ; SMS *transactionnel* si on le justifie)
5. Prépaiement **plus tard**, si le taux de retrait le force

C’est Pattern C + discipline opérationnelle. Pas un 2FA.

---

## 3. Alternatives, par préférence

| Rang | Mécanisme | Pourquoi |
|---|---|---|
| 1 | **Pilote sans OTP.** Qty → Réserver → code écran. 1 résa active. | Mesurer le vrai no-show avant de taxer la conversion. |
| 2 | **Numéro optionnel, non vérifié.** | Le commerçant peut appeler. Zéro SMS. |
| 3 | **Pattern C.** OTP seulement après 1 no-show, flood, ou numéro déjà signalé injoignable. | Cible le risque. C’est ce que les sources COD honnêtes recommandent. |
| 4 | Si le Juge impose une vérif : **après le 1er retrait réussi**, pas avant. | On vérifie un client qui a déjà prouvé ses pieds, pas un curieux en rayon. |
| 5 | SMS « c’est prêt / tu as 20 min » **après** la résa, jamais comme péage. | Canal utile, pas un mur. Justifier le coût là. |
| 6 | Prépaiement P2 si `NON_RECUPEREE` dépasse un seuil pilote. | Le dossier le prévoit déjà. C’est un vrai engagement, pas un théâtre SIM. |

Si on force quand même un OTP V1 (je le combats) : inline, pas de redirect, autofill *avec* SMS au format WebOTP, resend visible, **4 chiffres** (moins de fautes), expiry 90–120 s, **jamais** à chaque résa, **jamais** avant que le stock soit tenu *ou* clairement non tenu (afficher « encore X » en live). Même dans ce pire cas, le skip Pattern B doit arriver **après un retrait**, pas après un tap.

---

## 4. Ce que je refuse comme preuve

- « C’est gratuit, donc il faut fricter » — inversion. Gratuit + flash + local = on n’a pas le droit à un 2FA.
- « Too Good To Go / les apps le font » — eux encaissent. Autre contrat.
- « &lt; 2 % donc go » — best case d’un autre métier, autre moment du funnel.
- « Pattern B ≈ 0 » — vrai après la 50ᵉ résa d’un habitué. Faux pour un QR du premier mardi.
- « 6 chiffres = standard » — standard banque. On vend du pain.
- Un prototype à code `4827` en dur. Ça ne mesure rien.

---

## 5. Mesures que le Juge devrait exiger *avant* de généraliser l’OTP

Sans A/B, on débat des croyances.

1. Funnel : tap Réserver → (OTP si présent) → résa créée → confirmée → retirée
2. Complétion OTP (envoyé → OK) et délai médian d’arrivée SMS
3. % `NON_RECUPEREE` **avec** vs **sans** OTP (sinon on attribuera à l’OTP des no-shows qu’il n’a pas touchés)
4. Coût SMS / résa *réussie* (succès + abandons + resends)
5. Part de 1ʳᵉ visites vs récurrents (pour tuer le mythe Pattern B au pilote)

---

## 6. Sources

- Recherches cabinet (fournies pour ce débat) : inline &lt; 2 % vs 5–15 % / transaction ; SMS auth ~80 % ; Pattern B ≈ 0 long terme ; Pattern C recommandé ; inline + autofill + resend ; expiry 90–120 s
- Twilio SMS CH : https://www.twilio.com/en-us/sms/pricing/ch — USD 0,0769 / segment vers +41
- Twilio Verify : USD 0,05 / vérif réussie (synthèses 2026 Authgear / EngageLab)
- USD/CHF ≈ 0,81–0,82, 11–12 sept. 2026
- Releasit / Message Central « &lt; 2 % » : **claims vendeurs CoD Inde, sans méthodo — ne pas traiter comme preuve**
- EasySell (ne pas vérifier chaque commande) : https://easysellapp.com/blogs/wiki/risk-based-cod-verification-stop-checking-every-order
- Baymard téléphone / compte / abandon : https://baymard.com/blog/explain-phone-number-field (29 jul. 2025) ; https://baymard.com/blog/current-state-of-checkout-ux (25 nov. 2025) ; https://baymard.com/lists/cart-abandonment-rate (22 sept. 2025)
- Swisscom Web-to-SMS : https://documents.swisscom.com/product/filestore/lib/4b9709de-d71b-4381-98a3-4f19cf2da1ab/fs-web-to-sms-en.pdf — CHF 0,12 niveau H (date de barème floue)
- Bird SMS CH : https://bird.com/en-ch/pricing/connectivity/sms — USD 0,070 (13 sept. 2026)
- Meta WhatsApp auth RoWE : https://www.gupshup.ai/resources/wp-content/uploads/2025/12/EUR_Jan2026.pdf — € 0,0142 / msg au 1er jan. 2026
- LCD art. 3 al. 1 let. s (e-mail vendeur + confirmation, **pas** OTP client) : https://www.seco.admin.ch/fr/commerce-electronique
- LPD proportionnalité / minimisation : https://www.fedlex.admin.ch/eli/cc/2022/491/fr
- TGTG : prépaiement + no-show non remboursé (5 mars 2026) — **aucun** taux no-show publié, **aucune** étude OTP → −no-show
- NN/g login walls y compris flash-sale : https://www.nngroup.com/articles/login-walls/ (2014, qualitatif)
- Docs internes : `PRODUCT.md` (brand), `Architecture_MVP.md`, `Epicerie_Club_dossier.txt` §11 / §21 / §22, `AUDIT-UX-POST.md`, `copy-grille.md`
- Code : app principale `OfferDetailClient.tsx` (résa sans OTP) vs prototype brand `app/page.tsx` (numéro + OTP)

---

## 7. Synthèse pour le Juge (sans trancher)

L’OTP avant résa vend de la confiance commerçant et facture de la conversion client. Au pilote, tout le monde paie le prix 1ʳᵉ fois. Le stock se joue pendant l’attente SMS. Le commerçant refuse encore après. Le SMS CH n’est pas gratuit (Twilio ≈ CHF 0,10 / succès, Swisscom CHF 0,12 au petit volume). Les &lt; 2 % sont un claim vendeur. Baymard chiffre le refus de téléphone et le compte forcé. Le levier no-show qui a des preuves, c’est le prépaiement (TGTG), pas l’OTP. Légalement : utile possible, obligatoire non.

Je défends : **pas d’OTP à l’entrée**. Mesurer. Sanctionner les no-shows. Vérifier le risque, pas le quartier.

---

## 8. Addendum sources primaires (13 sept. 2026, 22:24)

Complète, ne remplace pas les 12 arguments. Corrige surtout le poids du « &lt; 2 % ».

### Ce qui est solide

1. **Baymard, pas l’OTP.** 14 % refus net du n° ; &gt; 70 % réticence ; 18 % abandon compte forcé ; 17 % checkout trop long ; 39 % des sites exigent un n° sans explication (fausses saisies). C’est le meilleur proxy public pour un gate téléphone avant une action.
2. **Prix +41.** Twilio USD 0,0769/seg + Verify 0,05 = ≈ CHF 0,10 / succès. Swisscom H = **CHF 0,12** + min. 100 + setup 500. Accents → UCS-2 → ×2. On paie aussi les abandons et les resends.
3. **WhatsApp plus cheap** que SMS CH (€ 0,0142 auth RoWE). Infra messagerie CH déjà là (WIP-CH 2025 : 96 % des internautes en messagerie instantanée, WhatsApp nommé en exemple — pas « 96 % WhatsApp » au sens strict). Ça n’autorise pas un gate WhatsApp à l’entrée non plus.
4. **Anti-no-show chiffré = prépaiement / non-remboursement** (règle TGTG 5 mars 2026 ; claims vendeurs TheFork −65 %, OpenTable −57 % — méthodo faible). **Zéro** étude « OTP avant résa → −X % no-show grocery / TGTG / CH ».
5. **Légal CH.** LCD 3.1.s : identité + e-mail **du vendeur**, confirmation e-mail. Téléphone vendeur recommandé, pas obligatoire. Téléphone client vérifié : **pas obligatoire** (LCD, LPD, LDAl). LPD art. 6 : proportionnalité / minimisation — OTP = traitement en plus + sous-traitant SMS souvent hors CH.

### Trous (ne pas combler)

- Aucun taux d’abandon OTP *résa flash* CH/EU 2024–2026.
- Aucun no-show grocery C&C / TGTG publié 2024–2026.
- Auth0 / Amplitude / LoginRadius : pas de stats OTP publiques.
- OpenTable −57 % / TheFork −65 % : claims vendeurs.
- Twilio 86 % : incident short codes US 2023, pas un benchmark CH 2026.
