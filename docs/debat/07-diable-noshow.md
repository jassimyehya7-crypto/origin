# Débat no-show + SMS auto — Position DIABLE (CONTRE)

**Contexte Épicerie Club (Villeneuve)**  
Résa gratuite, code `EC-xxxx`, stock à la résa, Pro Confirmer / Refuser.  
**Déjà tranché :** Pattern C (`03-verdict-juge.md`) ; téléphone skippable ; soft profile prénom à la 1ʳᵉ résa (`06-verdict-compte.md`) ; pas d’OTP à l’entrée ; SMS seulement si risque *prouvé*.

**Proposition Yehya :**
1. Client réserve, le commerçant ne scanne jamais le code → on déduit no-show en fin de journée (`NON_RECUPEREE`).
2. Échelle SMS automatique : 1ʳᵉ fois message doux (« oubli ; d’autres auraient pu en bénéficier ») ; 2ᵉ fois flag numéro ; 3ᵉ fois SMS + blocage résa 7 jours.
3. S’il n’y a pas de numéro, le patron ne peut pas appeler ni SMS-er.

**Rôle de ce doc :** attaquer l’inférence automatique, les SMS punitifs, la réouverture du téléphone obligatoire. Proposer des garde-fous. Pas de verdict final (au Juge).  
**Preuve :** docs internes, code, Baymard / LCD / LPD déjà sourcés. Zéro claim vendeur « −X % no-show grâce au SMS de honte ».

---

## 1. Ce que je combats

Trois idées collées en une :

- **Mesurer le client avec le geste du commerçant.** Pas de scan Pro = faute du client.
- **Punir par SMS** une inférence, puis bloquer 7 jours.
- **Rendre le téléphone obligatoire** parce que sinon « on ne peut pas punir / appeler ».

C’est Pattern B + compte forcé, revenus par la discipline. On vient de les juger.

---

## 2. Douze arguments contre

### 2.1 Pas de scan ≠ no-show

Le scan `RECUPEREE` est un **geste Pro**. Il manque quand :

- le commerçant est seul au rush et donne le pain sans ouvrir l’app
- la tablette / le téléphone Pro est dans l’arrière-boutique
- il a confirmé de tête (« je connais Marie »)
- le client a montré le code, personne n’a tapé
- le Wi-Fi lâche, l’app plante
- c’est le 1er mardi du pilote et le geste n’existe pas encore

Inférer `NON_RECUPEREE` de ça, c’est scorer la **compliance Pro**, pas l’honneur du client. Le dossier no-show (`Epicerie_Club_dossier.txt` §21) répond déjà : code, historique, limites, prépaiement plus tard — **pas** « absence de scan = faute ».

Le code a déjà un helper démo `cancelExpiredConfirmed()` (`store-local.ts`) : toute `CONFIRMEE` dont l’offre est `validUntil` passé → `NON_RECUPEREE`. C’est un **raccourci de seed**, pas une spec. Le productiser sans garde-fou empoisonne Pattern C dès J1.

### 2.2 `EN_ATTENTE` expirée n’est pas un no-show

Si le commerçant n’a jamais confirmé, le client n’avait rien à retirer. C’est un **drop commerçant**. Le mettre dans le même seau que « elle n’est pas venue » fausse le KPI `NON_RECUPEREE` (cible Juge : alerte si > 15 % des *confirmées*).

Trois états, pas un :

| Situation | Statut honnête |
|---|---|
| Offre finie, jamais confirmée | `EXPIREE` / rester `EN_ATTENTE` — **pas** no-show |
| Confirmée, pas de scan, commerçant n’a pas dit | `INCONNUE` ou `EXPIREE` — stock rendu, **pas** de strike |
| Commerçant tape « pas venue » | `NON_RECUPEREE` — seul vrai no-show |

### 2.3 Auto-no-show = Pattern B par la porte de derrière

Pattern C : OTP après **≥ 1 `NON_RECUPEREE`** (verdict OTP §2.3).  
Si chaque code non scanné devient `NON_RECUPEREE`, **tout le quartier** prend un strike au 1er soir où les commerçants oublient de scanner. Le lendemain : OTP pour tout le monde. Pattern B. Cold start tué. On a écrit que Pattern B = Pattern A au pilote. On ne le réintroduit pas via un cron de minuit.

`phone-risk.ts` incrémente déjà `recordNoShow(phone)` à chaque `NON_RECUPEREE`. Brancher l’auto-inférence là-dessus sans filtre = automate à OTP.

### 2.4 L’échelle 1 / 2 / 3 est un tribunal sans preuve

1ʳᵉ fois : SMS de morale.  
2ᵉ fois : flag.  
3ᵉ fois : SMS + ban 7 jours.

Si la 1ʳᵉ et la 2ᵉ sont des faux positifs Pro, la 3ᵉ bannit un client innocent. Pas d’appel, pas de « le commerçant s’est trompé », pas de distinction shop (un oubli chez Durgnat brûle le client chez Da Silva).

7 jours de blocage sur une app d’habitude quotidienne : on casse le KPI « revient chaque semaine » (dossier §23) pour une inférence.

Pattern C a **déjà** une escalade : OTP à la prochaine résa après un no-show *prouvé*. Empiler une 2ᵉ échelle (SMS honte + flag + ban) = complexité + double peine.

### 2.5 Le SMS « d’autres auraient pu en bénéficier » n’est pas transactionnel

Copy proposée : oubli + **culpabilité collective**. Ce n’est pas « ta résa a expiré, le stock est remis ». C’est une leçon.

- LCD art. 3 al. 1 let. s : le vendeur doit une **confirmation e-mail de commande**. Pas un SMS de honte. https://www.seco.admin.ch/fr/commerce-electronique
- Dossier légal interne : consentements marketing + désinscription. Un SMS moralisateur n’est pas dans la case « confirmation ».
- LPD art. 6 : proportionnalité. Traiter un n° pour sermonner, sur une inférence, est un traitement **de trop**. https://www.fedlex.admin.ch/eli/cc/2022/491/fr
- Verdict compte §4 : SMS à la résa **non** ; SMS Pattern C seulement si risque ; « c’est prêt » = plus tard, opt-in.

Je ne sors pas d’article OFCOM inventé. Je dis : ce texte n’est ni une OTP, ni une confirmation LCD. À faire valider avant d’automatiser. En produit, c’est un dark pattern (culpabiliser pour discipliner).

### 2.6 On paie les SMS des erreurs Pro

Twilio CH USD 0,0769/seg + Verify si on reclasse ça en OTP ; Swisscom H **CHF 0,12**/SMS.  
Échelle Yehya : SMS à la 1ʳᵉ *et* à la 3ᵉ, plus OTP Pattern C dès la 1ʳᵉ `NON_RECUPEREE`. Un faux positif = 1–2 SMS + un challenge à la résa suivante.

Arch. MVP : SMS seulement si économiquement justifié. Ici on justifie par une **hypothèse** de no-show, pas une mesure. Le Juge a demandé 2 semaines de baseline avant d’escalader (§2.4 / §5).

### 2.7 « Sans n° le patron ne peut pas appeler » ≠ téléphone obligatoire

C’est le même argument qu’on a déjà recadré : collecter ≠ forcer. Le téléphone reste **skippable** (verdicts 03 et 06). Baymard : **14 %** ne donneront jamais le n° ; **> 70 %** réticents ; mieux vide que faux (9999).

Sans n° on a encore :

- 1 résa active
- prénom + code à l’écran
- badge Pro « sans téléphone »
- strike sur **appareil / soft profile**, pas sur un SMS
- le commerçant refuse la prochaine s’il a vraiment été brûlé
- à Villeneuve, 10 commerces : le patron **marche** jusqu’au magasin

Rendre le n° obligatoire « pour que l’automate SMS marche » inverse le produit : on construit la discipline autour du canal le plus cher et le plus haï, puis on force le canal.

Le fondateur qui veut appeler tout le monde, c’est de l’ops. Ce n’est pas une spec d’identité.

### 2.8 Le levier no-show qui a des preuves n’est pas le SMS de honte

Déjà au dossier OTP (addendum §8, retenu par le Juge) :

- **Zéro** étude 2024–2026 « OTP ou SMS punitif → −X % no-show grocery / TGTG / CH »
- TGTG : **prépaiement** + pas de remboursement si no-show (règle 5 mars 2026) — autre contrat
- TheFork / OpenTable « −65 % / −57 % » : claims vendeurs, méthodo faible
- Bloom 3,7 % no-show resto US (août 2026) : **pas** grocery, **pas** CH — utile seulement pour ne pas paniquer avant d’avoir *nos* chiffres

Dossier interne §21 : code + historique + limites + **prépaiement plus tard**. On a déjà la feuille de route. L’automate de honte n’y figure pas.

### 2.9 Rappeler *avant* vaut mieux que sermonner *après*

OpenTable / TheFork recommandent le rappel + cancel 1 clic. **Aucun % isolé** 2024–2026 « SMS reminder seul → −X % » issu d’eux (trou, déjà flaggé). Le principe produit tient : un rappel **avant** la fin de fenêtre (« tu as jusqu’à 19h, code EC-3104 ») est utile, opt-in, transactionnel.

Un SMS **après** coup, une fois le stock perdu, ne ramène pas le croissant. Il paie pour une morale. Si on SMS, c’est *avant*, pas l’échelle 1-2-3.

### 2.10 Ban 7 jours vs habitude

KPI pilote : utilisateurs qui reviennent chaque semaine. Un blocage d’une semaine après 3 *inférences* = on sort le client pile quand on veut le faire revenir. Sur un feed quotidien, 7 jours c’est une mort. P2 éventuellement, **après** no-shows *confirmés commerçant* et taux réel > seuil (Juge : 15 % des confirmées). Pas en V1 automatique.

### 2.11 Deux systèmes de risque, zéro vérité

Aujourd’hui : `NON_RECUPEREE` → `recordNoShow` → Pattern C OTP.  
Yehya : même événement (ou un faux) → SMS + flag + ban.

Le commerçant, le client, le fondateur : trois lectures. « Je suis bloqué » / « je dois un code » / « je reçois un sermon ». UX barbante, support garanti. Un seul rail de risque : celui déjà jugé (Pattern C), alimenté **seulement** par un no-show déclaré.

### 2.12 On n’a pas le taux

Pas de baseline Villeneuve. Le helper démo et les seeds ne sont pas des no-shows. Automatiser la punition avant de savoir si le problème est 3 % ou 30 %, et avant de savoir le **taux de scan Pro**, c’est designer la police d’abord.

Mesure préalable, sinon on débat une peur :

1. `RECUPEREE` / `CONFIRMEE` par commerce (taux de scan Pro)
2. `NON_RECUPEREE` *déclarées* / `CONFIRMEE`
3. Part des « pas de scan » que le commerçant reclasse en « en fait récupéré » quand on lui demande

Si (1) est bas, l’automate est un mensonge. Si (3) est haut, aussi.

---

## 3. Garde-fous (ce que je défends, sans trancher)

| Rang | Garde-fou | Pourquoi |
|---|---|---|
| 1 | **Ne jamais** passer à `NON_RECUPEREE` sur « pas de scan » seul | Mesure le Pro, pas le client |
| 2 | Fin de journée Pro : liste des codes non scannés, **deux taps** — Récupérée / Pas venue. Défaut = `EXPIREE` (stock rendu, zéro strike) | 1 décision humaine, 10 s |
| 3 | `EN_ATTENTE` expirée → pas un no-show | Faute commerçant / délai |
| 4 | Strikes + Pattern C **uniquement** sur `NON_RECUPEREE` tapée par le Pro | Preuve |
| 5 | Téléphone **reste skippable**. Pas de n° = rail appareil + 1 résa active + badge. Pas d’appel fondateur obligatoire | Verdicts 03 / 06 |
| 6 | SMS *après coup* : soit **aucun** en V1, soit une ligne factuelle opt-in (« résa expirée, stock remis ») — **sans** « d’autres auraient pu » | Pas de honte, pas de LCD gris |
| 7 | Si SMS : **rappel avant** la fin de fenêtre, pas sermon après | Utile, pas punitif |
| 8 | Pas de ban 7 jours en V1. Pattern C (OTP à la suivante) suffit comme 1ʳᵉ friction | Un seul rail |
| 9 | Droit de contester : le Pro peut reclasse `NON_RECUPEREE` → `RECUPEREE` (erreur de tap) ; ça retire le strike | Faux positif réversible |
| 10 | Instrumenter 2 semaines **avant** tout cron punitif (taux de scan + no-shows déclarés) | Juge §5 déjà |

**Pas acceptable :**

- Cron minuit : pas de scan → no-show → SMS
- Copie « d’autres auraient pu en bénéficier »
- Téléphone obligatoire pour « faire marcher » l’automate
- Ban 7 jours sur inférence
- Deuxième échelle à côté de Pattern C

---

## 4. Alternative que je préfère (toujours sans verdict)

1. Client : qty → prénom → n° skippable → Réserver → code.  
2. Pro : Confirmer / Refuser. Au rush : bouton **Récupérée** (saisie code *ou* tap sur la ligne).  
3. Ce soir, 20 s : « 4 codes pas scannés — récupérés ou pas venus ? »  
4. Stock des `EXPIREE` rendu.  
5. Un vrai « pas venue » → Pattern C à la prochaine résa (OTP déjà spécifié).  
6. Rappel SMS/push **avant** 19h, plus tard, opt-in, justifié économiquement.  
7. Si après 14 jours `NON_RECUPEREE` *déclarées* > 15 % **et** commerçants qui décrochent : alors seulement prépaiement ou ban — comme le Juge l’a déjà écrit.

Le patron n’a pas besoin d’appeler les sans-n°. Il a besoin que le Pro dise la vérité en un tap.

---

## 5. Sources

- `03-verdict-juge.md` §2.3 (OTP après `NON_RECUPEREE` prouvé), §2.4 (pas d’escalade sans métriques), §4, §5 (cible 15 %)
- `06-verdict-compte.md` §3–4 (n° skippable, SMS seulement Pattern C)
- `store-local.ts` `cancelExpiredConfirmed()` + `recordNoShow` via `phone-risk.ts`
- Dossier §21 / §23 : no-show → code, historique, limites, prépaiement plus tard ; KPI retour hebdo
- Architecture MVP : SMS si justifié
- LCD 3.1.s : https://www.seco.admin.ch/fr/commerce-electronique
- LPD art. 6 : https://www.fedlex.admin.ch/eli/cc/2022/491/fr
- Baymard n° : 14 % / > 70 % — https://baymard.com/blog/explain-phone-number-field (29 jul. 2025) ; checkout UX 25 nov. 2025
- TGTG règle no-show (prépaiement, pas SMS) : help 5 mars 2026 — déjà au débat OTP
- Prix SMS CH : Twilio / Swisscom H — déjà au dossier
- **Trou :** aucune étude sourcée « SMS de honte / ban 7 j → −no-show grocery CH »

---

## 6. Synthèse pour le Juge (sans trancher)

Yehya veut qu’un scan oublié devienne une faute client, puis une leçon SMS, puis un ban. Ça mesure le commerçant, réouvre le téléphone obligatoire, et transforme Pattern C en Pattern B dès que le pilote est mal scanné.

Je défends : **pas de no-show sans tap Pro**. Stock rendu si on ne sait pas. Un seul rail de risque (Pattern C). Téléphone skippable. SMS, si un jour : rappel avant, pas sermon après.
