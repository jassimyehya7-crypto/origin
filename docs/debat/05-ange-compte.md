# Débat compte vs guest — Position ANGE (POUR confiance / qualité)

**Question Yehya :**  
Faut-il une **inscription dès l’arrivée** (nom + prénom + numéro + SMS) qui reste active jusqu’à suppression du compte ?  
Ou **guest / résa sans compte** ?

**Contexte OffresLocal (Villeneuve)**  
Réservation gratuite → code retrait → stock gelé → commerçant Confirmer / Refuser.  
**Verdict OTP déjà tranché** (`03-verdict-juge.md`) : Pattern C (risk-based) — pas d’OTP à l’entrée du pilote ; numéro demandé avec raison ; OTP seulement si risque.

**Rôle de ce doc :** défendre la confiance commerçant et la qualité des résas (savoir qui vient, pouvoir rappeler).  
**Pas de verdict final** (au Juge).

---

## 1. Recommandation ange (pas verdict final)

| Option | Position ange |
|---|---|
| Inscription mur dès l’arrivée (nom + prénom + n° + SMS) | **Non** — trop lourd, tue la découverte QR / feed |
| Guest pur forever (aucune identité utile au commerçant) | **Non** — stock gratuit sans fil = spam / fantômes / commerçant aveugle |
| **Compte soft à la 1ʳᵉ résa** (identité minimale, persistante) | **Oui — reco** |

**En une phrase :** on browse en guest ; on crée un **fil d’identité minimal** seulement au moment où le stock est gelé ; ce fil reste jusqu’à suppression — sans cérémonie « créer un compte ».

---

## 2. Ce dont le commerçant a vraiment besoin

Au comptoir Villeneuve, le commerçant doit pouvoir :

1. **Savoir qui vient** — un prénom / pseudo affichable (« Marie · 2× croissants »)
2. **Rappeler si besoin** — un numéro (même non OTP en V1, cf. verdict juge)
3. **Reconnaître un récidiviste** — même personne, même historique no-show / flood
4. **Ne pas traiter du bruit** — pas de résas anonymes en masse sans ancrage

Ce n’est **pas** besoin de :

- Mot de passe
- Email obligatoire
- Nom de famille dès la 1ʳᵉ résa
- SMS à l’entrée
- Profil complet avant de voir les offres

Le commerçant ne lit pas un dossier RH. Il lit une ligne d’inbox sur téléphone.

---

## 3. Design LE PLUS LÉGER (reco ange)

### 3.1 Principe : « Guest to soft account »

```
Arrivée (QR / feed)     → guest, zéro formulaire
1ʳᵉ résa                → identité minimale (voir ci-dessous)
Résas suivantes         → prérempli, 1 tap
Suppression compte      → efface le fil (droit d’oubli)
```

### 3.2 Champs à la 1ʳᵉ résa (ordre de légèreté)

| Champ | V1 | Pourquoi |
|---|---|---|
| **Prénom** (ou pseudo) | **Obligatoire** | Le commerçant appelle au comptoir ; « Client » est humiliant et inutile |
| **Téléphone** | **Demandé** + raison claire (« pour que le commerce t’appelle si besoin ») | Aligné verdict OTP ; refus possible → badge Pro « sans téléphone » |
| Nom de famille | **Non en V1** | Friction + vie privée ; inutile au retrait local |
| Email | **Non en V1** | Pas le canal contact magasin |
| Mot de passe | **Non** | Soft account = téléphone (ou device) comme clé, pas auth classique |
| SMS OTP | **Non à l’inscription** | Déjà tranché Pattern C — seulement si risque |

**Écran résa (1 fois) :**

1. Prénom  
2. Téléphone (optionnel de fait si refus, mais encouragé)  
3. Tap **Réserver**

Copy minimale sous le téléphone :  
`Pour que le commerce puisse t’appeler si besoin.`

### 3.3 Persistance (le « compte » sans en avoir l’air)

- Après la 1ʳᵉ résa : on **persiste** prénom + téléphone (device / session / soft user id).
- L’utilisateur **ne signe pas** « Créer un compte ».
- Profil = ce fil d’identité + historique résas + favoris.
- Reste actif **jusqu’à suppression** (bouton clair dans Profil).
- Changement de numéro = met à jour le fil (re-vérif OTP seulement si Pattern C le demande).

C’est un **compte soft**, pas un guest jetable, pas un signup bancaire.

### 3.4 Quand enrichir (après preuve de vie)

| Moment | Ajout possible | Pourquoi attendre |
|---|---|---|
| Après **1er retrait réussi** (`RECUPEREE`) | Nom complet optionnel, préférences notif | On enrichit qui a déjà prouvé ses pieds |
| Si commerçant a besoin d’un rappel écrit | Opt-in SMS « c’est prêt » | Consentement séparé, pas gate résa |
| Si métriques no-show / injoignable | OTP Pattern C (déjà jugé) | Escalade, pas mur d’entrée |

### 3.5 Ce qu’on refuse explicitement

| Pattern | Pourquoi non |
|---|---|
| Mur d’inscription à l’arrivée | Le QR rayon doit ouvrir l’offre en &lt; 2 s ; un formulaire avant le feed = abandon découverte |
| Guest sans aucun fil à la résa | Stock gratuit + anonymat = anti-confiance commerçant |
| Nom + prénom + n° + SMS dès l’arrivée | 4 frictions empilées avant valeur ; contredit aussi le verdict OTP V1 |
| Compte email + mot de passe | Hors sujet marketplace flash locale |
| Re-demander l’identité à chaque résa | Taxe répétée ; le soft account existe pour ça |

---

## 4. Arguments POUR (confiance & qualité)

### 4.1 Savoir qui vient

- Au retrait, le commerçant dit un **prénom**, pas un code seul.
- Inbox Pro lisible : `Marie · 079… · 2× croissants · EC-4F2A`.
- Seed actuel et modèle (`clientName`, `clientPhone`) vont déjà dans ce sens — il manque la **création légère** du fil, pas un guest infini.

### 4.2 Pouvoir rappeler

- Rupture, retard, « c’est prêt », clarification quantité.
- Sans fil téléphone (même soft), le Confirmer / Refuser devient un pari.
- Aligné verdict juge : numéro demandé avec raison ; badge si absent — mieux un vrai sans-n° qu’un faux n°.

### 4.3 Qualité marketplace (anti fantômes)

- Un prénom + n° ancré à un soft user id permet historique : no-show, flood, « injoignable ».
- Pattern C (OTP risk-based) **nécessite** un fil d’identité pour rattacher les signaux. Guest pur = Pattern C aveugle.
- Stock gelé gratuit sans ancrage = coût commerçant, pas coût client.

### 4.4 Confiance pilote Villeneuve

- Les commerces pilotes acceptent la plateforme s’ils voient des **vraies personnes**.
- Un mur signup à l’arrivée les rassure mal (ils ne le voient pas) et tue le volume client.
- Le soft account à la résa rassure **au bon moment** : quand une demande arrive dans l’inbox.

### 4.5 Légèreté ≠ absence

Légèreté = **moins de champs, au bon moment**.  
Pas = anonymat total.  
Guest pour **regarder** ; soft identity pour **réserver**.

---

## 5. Réponses aux attaques Diable probables

| Attaque | Réponse ange |
|---|---|
| « Guest checkout convertit mieux » | Oui pour **payer en ligne** sans relation magasin. Ici le commerçant est humain + stock local : l’identité minimale est le produit, pas un bonus CRM. |
| « Prénom obligatoire = friction » | Un champ, une fois. Moins cher qu’un no-show ou qu’un commerçant qui ignore l’inbox. |
| « Inscription dès l’arrivée = plus propre » | Plus propre en base, plus sale en conversion découverte. Le QR magasin ne doit pas ouvrir un formulaire. |
| « Sans SMS le numéro est faux » | Déjà tranché : Pattern C. On ne rouvre pas un péage SMS à l’inscription. Le soft account **prépare** l’escalade risque. |
| « Soft account = compte déguisé » | Oui, volontairement. Le mot « compte » fait peur ; le comportement (persistance + suppression) est ce qu’il faut. Copy UI : pas « Créer un compte », plutôt rien — ou « Tes infos pour le magasin ». |
| « Nom de famille pour sérieux » | Au comptoir local, le prénom suffit. Nom = P2 post-retrait ou si ambiguïté réelle. |

---

## 6. Parcours exact proposé (pour le Juge)

### Client

1. Arrive (feed / QR) → **guest**, voit les offres  
2. Choisit offre + qty  
3. Si 1ʳᵉ résa : **Prénom** + **Téléphone** (raison affichée)  
4. Tap Réserver → résa créée (stock gelé, code retrait)  
5. Soft account créé en silence (persistance)  
6. Résas suivantes : prérempli, pas de re-saisie  
7. Profil : voir / modifier prénom & n° ; **Supprimer mon compte**

### Commerçant

1. Inbox : prénom + n° (ou badge sans téléphone) + offre + qty + code  
2. Confirmer / Refuser / appeler  
3. Historique rattaché au soft user (no-show, etc.) → alimente Pattern C

---

## 7. Métriques pour trancher avec des preuves

Sur 2 semaines pilote :

1. % visiteurs qui atteignent l’écran résa  
2. Abandon **sur** l’écran prénom+n° (vs abandon offre)  
3. % résas avec téléphone fourni  
4. % appels commerçant réussis  
5. % `NON_RECUPEREE` / résas avec vs sans fil identité  
6. % clients qui reviennent (2ᵉ résa) grâce au préremplissage  
7. Suppressions de compte (doit rester rare et simple)

Critère ange de succès : commerçants qui **traitent** l’inbox + clients qui repassent sans refriction — sans mur à l’arrivée.

---

## 8. Synthèse pour le Juge

**POUR un fil d’identité**, **CONTRE l’inscription mur dès l’arrivée**, **CONTRE le guest pur à la résa**.

Reco concrète :

1. **Browse = guest**  
2. **1ʳᵉ résa = prénom + téléphone demandé** (SMS seulement Pattern C)  
3. **Soft account persistant** jusqu’à suppression  
4. **Pas de nom / email / password** en V1  
5. Enrichir **après 1er retrait réussi**, pas avant

C’est le design le plus léger qui laisse encore au commerçant savoir qui vient et pouvoir rappeler.
