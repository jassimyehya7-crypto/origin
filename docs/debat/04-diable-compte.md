# Débat compte à l’entrée — Position DIABLE (CONTRE)

**Contexte Épicerie Club (Villeneuve)**  
Résa gratuite, code retrait, stock à la résa, commerçant Confirmer / Refuser.  
**Déjà tranché** (`03-verdict-juge.md`) : Pattern C — pas d’OTP à l’entrée de la résa ; téléphone demandé, expliqué, **skippable**.

**Question Yehya :** le client s’enregistre-t-il dès l’arrivée (nom, prénom, numéro + SMS de confirmation), et le compte reste-t-il actif jusqu’à suppression ?

**Déclencheur visuel :** inbox Pro affiche Nom + Prénom + téléphone.  
**Rôle de ce doc :** attaquer l’inscription forcée / le compte obligatoire / le SMS à l’onboarding. Pas de verdict final (au Juge).  
**Règle de preuve :** zéro claim vendeur. Chiffres = Baymard, NN/g (qualitatif, vieux), LCD/LPD, docs et code internes.

---

## 1. Ce que je combats

Un mur d’identité **avant le feed**. QR en magasin → nom + prénom + n° + SMS → *ensuite* les offres. Plus un compte qui vit jusqu’à ce que le client trouve « supprimer ».

C’est Pattern B **déplacé à l’ouverture de l’app**. Pire que l’OTP avant résa : on taxe des gens qui n’ont même pas encore décidé de réserver.

---

## 2. La capture Pro n’est pas un parcours

L’inbox Pro affiche `clientName` + `clientPhone` (`ReservationsInbox.tsx`). D’où viennent ces noms ?

| Source | Valeur | Ce que ça prouve |
|---|---|---|
| `seed.ts` | `Marie Dupont`, `Jean Moret`, `Nicolas B.`, `Sophie L.`… | Des **fixtures** pour remplir l’inbox démo |
| `DEMO_CLIENT` / `client_demo` | `Demo Client` / `079 000 00 01` | Identité **hardcodée** de la démo |
| `createReservation` | `clientName = input.clientName, sinon state.client.name` (local) ou `DEMO_CLIENT.name` (Supabase) | Si le client n’envoie rien → **« Demo Client »** |
| `OfferDetailClient.tsx` `reserve()` | POST `{ offerId, quantity, message, scanSessionId }` | **Ni nom, ni téléphone** sur le tap Réserver réel |

La fiche Pro « Nom Prénom + n° » est du **théâtre de seed**. Le parcours live ne collecte pas ces champs. En déduire un compte à l’arrivée, c’est designer l’identité à partir d’un mock.

Le profil client affiche déjà `Villeneuve · Démo` et `Demo Client`. Ce n’est pas un utilisateur Villeneuve inscrit.

---

## 3. Dix arguments contre

### 3.1 Relitige le verdict, en pire

Le Juge a écrit (§4.8) : **pas** de signup forcé « pour skip OTP plus tard » au tap Réserver.  
§4.12 : pas d’OTP « parce que LCD / confiance ».  
§2 : téléphone **skippable** à la résa.

Nom + prénom + n° + SMS **à l’arrivée** = on remet le 2FA *et* on ajoute un état civil, *plus tôt*. Le SMS d’onboarding est Pattern B avec un champ de plus. On vient de le juger non pour le cold start.

### 3.2 QR en magasin : le cold start meurt à la porte

Parcours réel : scan QR → 10 secondes → offre du jour. Un mur « crée ton compte » avant le feed, c’est Rue La La (login wall à l’ouverture) vs Gilt (voir les ventes d’abord). NN/g : un wall avant de savoir si on veut s’inscrire fait partir les gens. Qualitatif, **2014** — seul test nommé sur *flash-sale*. On le cite comme principe, pas comme %.

Le dossier : sans clients, les commerçants ne publient pas. Un compte à l’arrivée taxe **100 % des ouvertures**, y compris ceux qui regardent et s’en vont. L’OTP à la résa ne taxait que les gens déjà décidés. Ici on élargit l’impôt.

### 3.3 Baymard : le compte forcé a déjà un % d’abandon

Chiffres publics, pas des blogs CoD :

| Claim | Chiffre | Source | Date |
|---|---|---|---|
| Abandon parce que le site **voulait un compte** | **18 %** (n=1 026) | https://baymard.com/lists/cart-abandonment-rate | maj. **22 sept. 2025** |
| Abandon checkout trop long / trop compliqué | **17 %** | même | **22 sept. 2025** |
| Internautes US qui **ne donneraient jamais** leur n° | **14 %** | https://baymard.com/blog/explain-phone-number-field | maj. **29 jul. 2025** |
| Réticents à donner un n° | **&gt; 70 %** | https://baymard.com/blog/current-state-of-checkout-ux | maj. **25 nov. 2025** |
| Sites qui n’offrent pas le guest en option la plus visible | **62 %** | checkout UX 2025, même page | **25 nov. 2025** |

On vient d’enlever l’OTP de la résa pour ça. Le remettre à l’**ouverture**, avec nom + prénom en plus, c’est 3–4 champs + attente SMS *avant* toute valeur. Baymard 2024 : checkout moyen **5,1 étapes / 11,3 champs** — et ils disent que c’est trop. Nous n’avons même pas de panier.

### 3.4 Le SMS à l’arrivée est le pire moment possible

Complétion SMS auth ~80 % (cabinet, déjà retenu par le Juge) = **~20 % de perte** dès qu’on challenge. À l’arrivée, le client n’a pas vu d’offre, pas choisi de quantité, pas de stock en jeu pour *lui*. Il referme. On a payé le SMS (Twilio CH USD 0,0769/seg + Verify 0,05 ≈ CHF 0,10 ; Swisscom H **CHF 0,12**) pour un non-utilisateur.

LPD + économie : on n’a pas justifié le SMS à la résa. Encore moins à l’ouverture.

### 3.5 Nom + prénom = état civil pour une baguette

Le commerçant a besoin d’un **indicatif** au comptoir : « Nicolas ? » / code `EC-3104`. Pas d’un nom de famille. Les seeds elles-mêmes hésitent : `Nicolas B.`, `Sophie L.`, `Pierre A.` — déjà un prénom + initiale, pas un registre.

LCD art. 3 al. 1 let. s : identité + e-mail **du vendeur**, confirmation e-mail. Rien sur le nom légal du client.  
https://www.seco.admin.ch/fr/commerce-electronique  

LPD (RS 235.1) art. 6 : proportionnalité / minimisation. Nom + prénom + n° vérifié + compte persistant = fichier d’identité. Pour une résa gratuite au retrait, c’est disproportionné.  
https://www.fedlex.admin.ch/eli/cc/2022/491/fr  

LDAl : **aucune** obligation de fiche client pour réserver une denrée au retrait (déjà établi, débat OTP).

### 3.6 « Compte actif jusqu’à suppression » crée un fichier, pas une habitude

Tant que le client n’a pas retiré une fois, on n’a pas de relation. Un compte qui vit « jusqu’à suppression » :

- impose une **durée de conservation** (LPD art. 6 + information art. 19)
- impose un vrai bouton supprimer (droit d’effacement) — pas un compte zombie
- transforme un scan QR en **dossier** : nom, n°, historique, appareil

Minimisation : une **session appareil** (cookie / localStorage) suffit pour « tes résas d’aujourd’hui ». Pas besoin d’un user row nommé.

Baymard : les gens forcés à donner un n° **inventent** 9999. Un compte forcé produira des « Jean Test » / « Demo Client ». Le Pro croira à une identité. C’est pire que « Sans téléphone ».

### 3.7 Les docs produit disent déjà l’inverse

`PRODUCT.md` (surface client) :

- « QR ou ouverture directe, **découverte sans compte** »
- « Navigation et découverte **libres sans inscription** »
- « Connexion simulée demandée **seulement** au moment de réserver ou de suivre »
- Principe : « **Montrer la valeur avant de demander un compte** »
- « Faire de la réservation l’action la plus rapide »

Architecture : SMS seulement si économiquement justifié.  
Copy-grille : « Couper tout ce qui n’aide pas à réserver ou retirer. »

Un onboarding nom/prénom/n°/SMS viole ces phrases une par une.

### 3.8 Double collecte, double confusion

Le verdict résa : téléphone **à la résa**, skippable, expliqué.  
Si on le demande **aussi** à l’arrivée + SMS, on a deux moments, deux copies, deux raisons. Le client ne sait plus ce qui est obligatoire. Le Pro ne sait pas si le n° vient du compte ou de la résa.

Un champ, un moment. Le moment déjà choisi : la résa. Pas l’arrivée.

### 3.9 Guest checkout est le pattern documenté, pas le compte-first

NN/g *Optional Registration* (5 jul. 2015, qualitatif) : laisser acheter, proposer le compte **après**.  
NN/g *Login Walls* (2 mars 2014) : ne pas murer l’entrée d’une flash sale.  
Baymard 18 % + 62 % : le marché e-com *échoue déjà* à mettre le guest en avant — et ça coûte de la conversion. Nous n’avons aucune raison de copier l’échec.

Passkeys / Sign in with Apple : **trou** de preuve sur « avant offre flash ». Et ça suppose un compte. Inutile comme premier gate (déjà noté débat OTP).

### 3.10 L’habitude se gagne au 2ᵉ retrait, pas à l’état civil

KPI dossier : utilisateurs qui **reviennent** chaque semaine. On ne revient pas parce qu’on a un compte. On revient parce que le croissant était là. Compte après preuve de pieds — éventuellement. Compte avant la 1ʳᵉ offre : on mesure l’inscription, pas l’usage.

---

## 4. Ce qui est acceptable (sans trancher)

Ordre de préférence. Ce n’est pas un verdict.

| Rang | Mécanisme | Pourquoi c’est tenable |
|---|---|---|
| 1 | **Guest total.** QR → feed → qty → téléphone skippable (verdict) → Réserver → code. Zéro nom. Pro affiche « Client » + code + badge téléphone. | Aligné Pattern C, LPD, PRODUCT.md. |
| 2 | **Prénom optionnel, une fois, à la résa** (pas à l’arrivée). Un champ. « Comment le commerce t’appelle ? » Skip = « Client ». **Pas de nom de famille.** | Indicatif comptoir, pas état civil. Les seeds `Nicolas B.` suffisent comme modèle d’affichage, pas comme spec d’inscription. |
| 3 | **Session appareil** pour l’historique du jour / de la semaine. Pas un user nommé. | « Tes résas » sans fichier. |
| 4 | **Compte souple après le 1er retrait réussi**, si le client veut garder l’historique ou suivre un commerce. Toujours **sans SMS** sauf Pattern C. | Valeur d’abord. Le Juge a déjà ouvert cette porte pour l’OTP (§2.4). |
| 5 | Si un jour il y a un compte : **supprimer** visible, conservation courte, pas « actif jusqu’à ce que tu déniches le réglage ». | LPD. La phrase de Yehya inverse la charge. |

**Pas acceptable :**

- Mur à l’arrivée (avant le feed)
- Nom de famille obligatoire
- SMS / OTP à l’onboarding
- Téléphone obligatoire à l’arrivée (contredit le skippable à la résa)
- Inférer la spec depuis `Marie Dupont` / `Demo Client`
- Compte « pour plus tard skip OTP » — déjà interdit par le Juge

---

## 5. Ce que le Pro doit afficher (sans exiger un compte)

La ligne utile au commerçant, déjà dans le verdict OTP :

1. Indicatif : prénom **ou** « Client »
2. Téléphone **ou** badge « Sans téléphone »
3. Code `EC-xxxx` + qty + offre

Pas besoin de `Marie Dupont` pour Confirmer / Refuser / appeler. Nettoyer les seeds pour qu’elles ne vendent plus un état civil (label « démo », prénoms seuls).

---

## 6. Mesures si on A/B quand même un compte (le Juge devrait les exiger)

1. Ouvertures QR → feed vu (avec mur vs sans)
2. Feed vu → tap Réserver
3. Tap → résa créée (cible Juge ≥ 92 %)
4. % qui abandonnent au 1er écran si mur
5. % de faux noms / faux n° si compte forcé

Sans ça, on débat une capture démo.

---

## 7. Sources

- Verdict Pattern C : `docs/debat/03-verdict-juge.md` (§2, §4.8, §4.12)
- Code : `OfferDetailClient.tsx` (POST sans nom/tel) ; `store-local.ts` / `store-supabase.ts` (fallback `Demo Client`) ; `seed.ts` (`Marie Dupont`, `Demo Client`) ; `ReservationsInbox.tsx` ; `profil/page.tsx` (« Villeneuve · Démo »)
- PRODUCT.md : découverte sans compte ; valeur avant compte
- Baymard abandon / compte / téléphone / guest : URLs §3.3
- Baymard checkout 5,1 étapes / 11,3 champs : https://baymard.com/blog/Checkout-flow-average-form-fields — **26 jun. 2024**
- NN/g login walls : https://www.nngroup.com/articles/login-walls/ — **2 mars 2014** (qualitatif, vieux)
- NN/g optional registration : https://www.nngroup.com/articles/optional-registration/ — **5 jul. 2015** (qualitatif, vieux)
- LCD : https://www.seco.admin.ch/fr/commerce-electronique
- LPD : https://www.fedlex.admin.ch/eli/cc/2022/491/fr
- Prix SMS CH : déjà au dossier OTP (Twilio, Swisscom H) — rappel, pas une nouvelle claim

**Trous (ne pas combler) :** pas de % « inscription à l’ouverture d’une offre flash locale CH » ; pas de preuve que nom+prénom réduisent les no-shows.

---

## 8. Synthèse pour le Juge (sans trancher)

Yehya lit une inbox remplie par des seeds et en déduit un registre d’état civil + SMS dès le QR. Le code live n’envoie ni nom ni téléphone. Le verdict OTP interdit déjà le signup forcé et le SMS à l’entrée.

Je défends : **pas de compte à l’arrivée**. Guest. Prénom optionnel à la résa, une fois, si on veut un indicatif. Compte seulement après qu’on a prouvé que ça sert — et encore, sans SMS sauf Pattern C.
