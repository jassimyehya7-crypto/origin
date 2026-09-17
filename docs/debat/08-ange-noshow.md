# Débat no-show auto + SMS 1/2/3 + blocage 7j — Position ANGE

**Question Yehya :**  
Fondateur voit une résa sans `RECUPEREE` (code jamais scanné) → **no-show déduit** → **SMS progressifs**.  
Tension : téléphone **skippable** (verdicts OTP + compte) vs besoin du n° pour SMS / appel.

**Contexte OffresLocal (Villeneuve)**  
Résa gratuite → stock gelé → Confirmer / Refuser Pro → code retrait.  
**Déjà tranché :** Pattern C OTP (`03`) ; soft profile à la 1ʳᵉ résa, téléphone demandé skippable (`06`).

**Rôle de ce doc :** POUR la discipline magasin et le respect du stock, **tout en restant humain** (1er SMS = oubli possible).  
**Pas de verdict final** (au Juge).

---

## 1. Recommandation ange (pas verdict final)

| Élément | Position ange |
|---|---|
| No-show auto si code jamais scanné dans la fenêtre | **Oui** — discipline stock, pas punition morale |
| Escalade SMS 1 → 2 → 3 | **Oui** — progressive, humaine au 1, ferme au 3 |
| Blocage 7 jours au niveau 3 | **Oui** — pause, pas ban à vie |
| Mur téléphone pour pouvoir SMS | **Non** — contredit `03` / `06` |
| Encourager fortement le n° sans mur | **Oui** — nudges + conséquences claires si absent |
| Chemin parallèle si pas de n° | **Oui** — sinon les skippeurs échappent à la discipline |

**En une phrase :** on déduit le no-show objectivement (pas de scan) ; on parle d’abord comme à quelqu’un qui a oublié ; on durcit ensuite ; sans numéro, on ne invente pas de SMS — on discipline autrement (in-app + soft id + n° exigé à la prochaine résa).

---

## 2. Déclencheur no-show (objectif, fondateur-compatible)

### 2.1 Règle métier

Une résa devient `NON_RECUPEREE` **automatiquement** quand **tout** ceci est vrai :

1. Statut était `CONFIRMEE` (ou équivalent « à retirer »)  
2. Le **code n’a jamais été scanné / saisi** → jamais passé `RECUPEREE`  
3. La **fenêtre de retrait** est close

**Fenêtre V1 proposée :**

| Cas | Clôture auto |
|---|---|
| Offre avec créneau / « à récupérer avant H » | À **H + 30 min** (marge humaine) |
| Fin de journée magasin | À l’heure de fermeture du shop (ou job fondateur « clôturer la journée ») |
| Refus Pro / annulation client | **Pas** un no-show — autres statuts |

Le fondateur « voit sans RECUPEREE » = le **même signal** que le job auto ; UI fondateur peut forcer / corriger (faux positif rare : Pro a oublié de scanner → bouton « Marquer récupérée » côté Pro dans les 24 h).

### 2.2 Effets immédiats du no-show

1. Statut → `NON_RECUPEREE`  
2. Stock restauré (déjà prévu)  
3. `recordNoShow(softUserId / phone)` — alimente Pattern C  
4. Escalade SMS **si** numéro présent (sinon chemin §5)

---

## 3. Design exact des 3 niveaux SMS

Philosophie : **1 = oubli**, **2 = attention**, **3 = pause**.  
SMS toujours **courts**, factuels, sans culpabilisation moraliste, sans lien marketing.

### Niveau 1 — Rappel doux (1er no-show)

| | |
|---|---|
| **Quand** | Dès le passage auto en `NON_RECUPEREE` (1er strike sur le fil) |
| **Ton** | Humain : oubli possible, stock local |
| **But** | Informer + réapprendre la règle, **pas** punir |
| **SMS** | `OffresLocal: ta résa n’a pas été retirée. Le stock est rendu au magasin. Pense à venir ou annuler la prochaine fois.` |
| **Variante ultra-courte** | `OffresLocal: résa non retirée — stock rendu au magasin.` |
| **Reco texte** | Variante ultra-courte en V1 (coût + lisibilité) ; phrase « annuler » en P2 si on a un deep link d’annulation |
| **In-app** | Bannière sur Réservations / prochaine offre : même message |
| **Conséquence résa** | Aucune — peut réserver demain |
| **OTP Pattern C** | Flag risque allumé (déjà `noShows >= 1`) — OTP **avant prochaine résa** si n° présent (aligné `03`) |

### Niveau 2 — Avertissement (2e no-show)

| | |
|---|---|
| **Quand** | 2e `NON_RECUPEREE` sur le même soft user / n° (dans une fenêtre glissante **90 jours**) |
| **Ton** | Clair, toujours respectueux |
| **But** | Prévenir le blocage ; protéger les commerçants |
| **SMS** | `OffresLocal: 2e résa non retirée. Encore une = pause 7 jours. Merci de respecter le stock des commerces.` |
| **In-app** | Modal soft une fois : même copy + « J’ai compris » |
| **Conséquence résa** | Toujours possible, mais OTP Pattern C si n° ; badge Pro optionnel « historique fragile » (interne, pas humiliant côté client) |
| **Appel** | Pro **peut** appeler si n° — pas d’obligation ; le SMS porte la discipline plateforme |

### Niveau 3 — Pause 7 jours (3e no-show)

| | |
|---|---|
| **Quand** | 3e `NON_RECUPEREE` (même fenêtre 90 j) |
| **Ton** | Ferme, factuel, réversible |
| **But** | Protéger le stock ; signal sérieux |
| **SMS** | `OffresLocal: 3 résas non retirées. Pause jusqu’au [date +7j]. Après, tu pourras réserver à nouveau.` |
| **In-app** | Écran bloqué à la résa : date de fin + explication 1 ligne |
| **Conséquence** | **Blocage résa 7 jours** (soft user id **et** n° si présent) |
| **Pas** | Ban à vie, pas doxxing, pas message moralisateur |
| **Sortie** | Auto à J+7 ; compteur strikes peut reset partiel (voir §4) ou rester à « sous surveillance » (1 strike restant) |

### Tableau récap

| Niveau | Strikes | Canal | Client peut réserver ? | Pattern C OTP |
|---|---|---|---|---|
| 1 | 1 | SMS (si n°) + in-app | Oui | Oui avant prochaine (si n°) |
| 2 | 2 | SMS + modal | Oui | Oui |
| 3 | 3 | SMS + mur date | **Non pendant 7 j** | N/A pendant pause ; au retour = traité comme risque |

---

## 4. Compteurs & humanité (détails ange)

| Règle | Valeur |
|---|---|
| Fenêtre strikes | **90 jours** glissants |
| Reset après pause 7j | Repart à **1** (sous surveillance), pas à 0 — évite le yo-yo abuse |
| Faux positif scan oublié | Pro peut passer `RECUPEREE` sous 24 h → **annule** le strike + n’envoie pas / annule le SMS si pas encore parti |
| Client annule avant fin de fenêtre | **Pas** un strike |
| Pro refuse | **Pas** un strike |
| Plusieurs résas même jour non retirées | **1 strike max / jour civil** — oubli groupé ≠ 3 strikes d’un coup |
| Coût SMS | Un SMS / niveau franchi, pas de relance quotidienne |

Humanité = on suppose l’oubli au 1 ; on prévient au 2 ; on coupe au 3 — et on ne multiplie pas les SMS.

---

## 5. Tension téléphone skippable — encourager sans mur

### 5.1 Principe

Le n° reste **skippable** à la 1ʳᵉ résa (`06`).  
Mais sans n°, **pas de filet SMS** → la discipline doit vivre ailleurs, et le n° doit devenir **évidemment utile**, pas obligatoire moralement.

### 5.2 Encourager le n° (sans mur)

| Moment | Nudge | Copy / UX |
|---|---|---|
| 1ʳᵉ résa | Demande + raison (déjà jugé) | `Pour que le commerce puisse t’appeler si besoin.` |
| Après Confirmée | Micro-bénéfice | In-app : `Ajoute ton n° pour un SMS si tu oublies — et pour que le magasin t’écrive « c’est prêt ».` CTA soft |
| Profil | Champ vide visible | `Téléphone manquant — les rappels no-show et « c’est prêt » sont désactivés.` |
| Post niveau 1 **sans** n° | Nudge fort mais skippable une fois | `On n’a pas pu t’écrire. Ajoute un n° pour les prochains rappels.` |
| Avant 2e résa si soft user a déjà 1 no-show **sans** n° | **N° demandé à nouveau**, toujours skippable mais copy plus nette | `Sans numéro, en cas d’oubli on ne peut pas t’avertir — et le magasin ne peut pas t’appeler.` |

**Pas de mur QR. Pas de SMS OTP pour « débloquer » le droit de donner son n°.**

### 5.3 Chemin parallèle sans numéro (critique)

Sans ça, skipper le n° = skipper la discipline → anti-ange.

| Strike sans n° | Action |
|---|---|
| 1 | In-app uniquement (même copy niveau 1) + flag risque sur soft user id / device |
| 2 | Modal obligatoire « J’ai compris » + **n° fortement encouragé** ; résa encore OK |
| 3 | **Même pause 7 j** via soft user id (et device id) — **pas besoin de SMS pour bloquer** |
| À la sortie de pause / à la résa suivante après strike ≥ 1 sans n° | Écran : prénom (prérempli) + **téléphone demandé** ; si toujours skip → badge Pro « sans téléphone · historique fragile » |

Le SMS est un **canal de respect** (prévenir l’humain).  
Le **blocage** est une **règle stock** — il ne dépend pas du SMS.

### 5.4 Ce qu’on ne fait pas

- Rendre le n° obligatoire à l’arrivée  
- Bloquer la 1ʳᵉ résa sans n°  
- Envoyer un SMS « donne ton numéro » spam  
- Punir plus fort les gens **avec** n° que ceux sans (injustice → tout le monde skippe)

Les deux chemins convergent vers la **même pause 7 j** au 3e strike.

---

## 6. Qui déclenche quoi (fondateur / système / Pro)

| Acteur | Rôle |
|---|---|
| **Job auto / clôture journée** | Passe `CONFIRMEE` → `NON_RECUPEREE` si pas de scan ; incrémente strike ; enqueue SMS niveau |
| **Fondateur (cockpit)** | Voit la file « non récupérées » ; peut forcer clôture ; lit métriques no-show |
| **Pro** | Scan code → `RECUPEREE` ; correctif 24 h si oubli scan ; **n’envoie pas** les SMS discipline (plateforme) |
| **Plateforme** | Seule émettrice SMS 1/2/3 + applique blocage 7 j |

Le commerçant confirme le stock ; la plateforme protège le réseau.

---

## 7. Arguments POUR (discipline + humanité)

1. **Stock gratuit = responsabilité** — sans conséquence, le Confirmer Pro finance les oublis.  
2. **Objectif** — « code jamais scanné » bat le jugement moral « mauvais client ».  
3. **Progressivité** — le 1er SMS assume l’oubli (ange) ; le 3 assume la récidive (magasin).  
4. **Confiance commerçant** — ils restent si les fantômes ont un coût côté client.  
5. **Cohérence Pattern C** — no-show allume le risque ; OTP + SMS discipline = même histoire, moments différents.  
6. **Sans n° ≠ impunité** — soft id / device portent la pause ; nudges poussent le n° pour le **service** (rappel), pas pour la punition seule.

---

## 8. Réponses aux attaques Diable probables

| Attaque | Réponse ange |
|---|---|
| « SMS no-show = harcèlement » | 1 SMS / niveau, max 3 / 90 j, copy factuelle. Pas de daily nag. |
| « Auto no-show faux si Pro oublie le scan » | Correctif Pro 24 h + marge H+30. Mieux que zéro discipline. |
| « Sans n° obligatoire la ladder SMS est morte » | Le blocage vit sans SMS ; le n° sert à **prévenir** (humain), pas à **exister** la règle. |
| « 7 j c’est dur pour un oubli » | 7 j seulement au **3e** strike / 90 j, après 2 messages. 1er oubli = zéro pause. |
| « Ça tue la conversion pilote » | Les curieux one-shot peu scrupuleux partent ; les commerçants restent. Pilote = confiance B2B locale d’abord. |
| « Fondateur ne doit pas juger à la main » | OK — job auto primaire ; cockpit = transparence + override rare. |

---

## 9. Métriques (2 semaines pilote)

1. Taux `CONFIRMEE` → `RECUPEREE` vs `NON_RECUPEREE`  
2. Distribution strikes 1 / 2 / 3  
3. % clients avec n° au moment du strike (SMS délivrables)  
4. Taux d’ajout de n° **après** nudge post-no-show  
5. % faux positifs corrigés Pro &lt; 24 h  
6. Résas perdues pendant pause 7 j vs no-shows évités après niveau 1–2  
7. Sentiment commerçant (traitent-ils plus l’inbox ?)

Critère ange : `NON_RECUPEREE` baisse **sans** explosion d’abandon 1ʳᵉ résa ni plaintes « harcèlement SMS ».

---

## 10. Synthèse pour le Juge

**POUR** no-show auto + ladder SMS 1/2/3 + pause 7 j.  
**POUR** humanité au niveau 1.  
**CONTRE** mur téléphone.  
**POUR** chemin parallèle soft id si n° skippé.  
**POUR** nudges qui rendent le n° utile (rappels), pas obligatoire.

SMS reco V1 :

1. `OffresLocal: résa non retirée — stock rendu au magasin.`  
2. `OffresLocal: 2e résa non retirée. Encore une = pause 7 jours. Merci de respecter le stock des commerces.`  
3. `OffresLocal: 3 résas non retirées. Pause jusqu’au [date]. Après, tu pourras réserver à nouveau.`

Discipline magasin ≠ froid. C’est prévenir d’abord, puis protéger le stock.
