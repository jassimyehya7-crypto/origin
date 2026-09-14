# Verdict juge — Identité client / compte vs guest

**Dossier :** `04-diable-compte.md` + `05-ange-compte.md`  
**Préalable :** `03-verdict-juge.md` (Pattern C — pas d’OTP à l’entrée ; téléphone demandé, expliqué, skippable)  
**Critère :** réserver simple, pas barbant ; confiance commerçant ; preuves ; LPD/minimisation ; pas designer depuis les seeds.

---

## 0) Erreurs de raisonnement (strict)

| Erreur | Pourquoi c’est faux | Sanction |
|---|---|---|
| « L’inbox Pro montre Nom+Prénom+n° → donc inscription dès l’arrivée » | Les noms viennent de `seed.ts` (`Marie Dupont`, `Nicolas B.`, `Demo Client`). Le POST live (`OfferDetailClient.reserve`) n’envoie **ni nom ni téléphone** ; fallback = `Demo Client`. | **Théâtre de seed ≠ spec produit** |
| « Compte + SMS à l’ouverture = confiance » | Taxe 100 % des ouvertures QR, y compris les curieux qui ne réservent pas. Pire que l’OTP avant résa (déjà rejeté). | Contredit Pattern C + PRODUCT.md |
| « Guest forever = simple » | Sans fil d’identité, Pattern C (no-show / injoignable / flood) est **aveugle** ; le Pro confirme du vent. | Guest *browse* oui ; guest *forever à la résa* non |
| « Nom + prénom = sérieux » | Au comptoir : prénom / pseudo suffit. Nom de famille = état civil disproportionné (LPD art. 6). | Nom de famille **hors V1** |
| « Soft account sans le dire = dark pattern » | Le dark pattern, c’est le mur avant valeur. Persister prénom+n° après une résa volontaire, avec **Supprimer** visible, est de la minimisation honnête — à condition de **ne pas** écrire « Créer un compte ». | Copy : zéro jargon compte à la résa |
| Claims Baymard mal lus | 18 % abandon *parce que compte forcé* = argument **contre** le mur, pas pour un soft profile à la résa. Ne pas les coller sur le prénom optionnel. | Garder Baymard pour l’arrivée / le compte forcé uniquement |

---

## 1) Verdict clair

### **Hybride — Guest browse + soft profile à la 1ʳᵉ résa**

| Option | Décision |
|---|---|
| Guest total forever | **Non** (à la résa) |
| Soft profile (fil d’identité minimal, persistant) | **Oui — verdict** |
| Compte obligatoire (mur / signup) | **Non** |
| Inscription dès l’arrivée (nom/prénom/n°+SMS) | **Non** |
| Hybride | **Oui** = guest jusqu’au tap Réserver, puis soft profile |

**En une phrase :** on regarde sans compte ; on laisse un **fil minimal** (prénom + téléphone demandé) seulement quand le stock gèle ; ce fil vit jusqu’à suppression — **sans** SMS sauf Pattern C, **sans** mur QR.

Alignement : Ange sur le soft profile à la résa ; Diable sur le rejet du mur / SMS / nom de famille / seeds. Les deux **s’accordent** déjà contre l’inscription à l’arrivée — le débat réel était guest pur vs soft à la résa.

---

## 2) Parcours exact — 1ʳᵉ visite QR magasin

1. Scan QR magasin (`/q/[shopSlug]`) → enregistre le scan  
2. **Feed / offre tout de suite** — zéro formulaire, zéro SMS, zéro « Créer un compte »  
3. Client ouvre une offre, choisit la quantité  
4. Écran résa (1ʳᵉ fois seulement) :
   - **Prénom** (ou pseudo) — obligatoire  
   - **Téléphone** — demandé + raison : `Pour que le commerce puisse t’appeler si besoin.` — skippable → badge Pro « sans téléphone »  
5. Tap **Réserver** → résa créée immédiatement → stock gelé → code `EC-xxxx` à l’écran → statut `EN_ATTENTE`  
6. En silence : soft profile persisté (device / soft user id) = prénom + n° éventuel + historique  
7. Visites suivantes : feed libre ; à la résa, champs **préremplis**, 1 tap  
8. Profil : voir / modifier prénom & n° ; bouton clair **Supprimer mon compte** (efface le fil)

**Jamais** à l’étape 1–2 : nom, prénom, n°, SMS, email, mot de passe.

---

## 3) Quels champs — obligatoires / optionnels / jamais

| Champ | V1 | Moment | Notes |
|---|---|---|---|
| **Prénom / pseudo** | **Obligatoire** | 1ʳᵉ résa | Un champ, une fois. Indicatif comptoir (« Marie ? »). Pas d’état civil. |
| **Téléphone** | **Demandé, skippable** | 1ʳᵉ résa | Aligné `03-verdict-juge.md`. Mieux vide que faux. |
| Nom de famille | **Jamais en V1** | — | P2 optionnel **après** 1er `RECUPEREE` si besoin |
| Email | **Jamais en V1** | — | Pas le canal magasin |
| Mot de passe | **Jamais** | — | Soft profile ≠ auth bancaire |
| SMS / OTP | **Seulement Pattern C** | Après risque | Pas à l’arrivée, pas à la création du soft profile |
| « Créer un compte » (copy) | **Jamais** | — | UI silencieuse ; Profil parle d’« infos pour le magasin » |

---

## 4) SMS oui/non et quand

| Moment | SMS ? |
|---|---|
| Arrivée / QR / feed | **Non** |
| Création soft profile / 1ʳᵉ résa | **Non** |
| Chaque résa | **Non** |
| Pattern C (no-show, injoignable, flood, nouveau n° à risque) | **Oui** — OTP 6 chiffres inline (verdict OTP) |
| « C’est prêt » transactionnel | **Plus tard**, opt-in séparé, hors gate — pas ce dossier |

Rappel coût CH : ≈ CHF 0,10–0,12 / succès. On ne paie pas un SMS pour un curieux en rayon.

---

## 5) Ce qu’on montre au Pro (et pourquoi les seeds ont trompé)

### Ligne inbox utile

1. **Prénom** (ou « Client » seulement si bug / legacy — ne doit plus être le happy path)  
2. Téléphone **ou** badge **« sans téléphone »**  
3. Badge **« non vérifié »** / **« vérifié »** (après Pattern C)  
4. Offre + qty + code `EC-xxxx`

Pas besoin de `Marie Dupont` pour Confirmer / Refuser / appeler.

### Pourquoi les seeds ont trompé

| Ce qu’on voit en démo | Réalité code |
|---|---|
| `Marie Dupont`, `Jean Moret`, `Nicolas B.`… | Fixtures `seed.ts` pour remplir l’inbox |
| Profil `Demo Client` · `079 000 00 01` · « Villeneuve · Démo » | Identité hardcodée `client_demo` |
| Tap Réserver live | POST **sans** `clientName` / `clientPhone` → fallback Demo Client |

**Consigne produit :** relabeliser / alléger les seeds (prénom seul, badge « démo ») pour qu’elles n’imposent plus un registre d’état civil à Yehya. Ne **jamais** inférer la spec d’onboarding depuis l’inbox seedée.

---

## 6) Ce qu’on NE fait PAS

1. **Pas** de mur d’inscription à l’arrivée (avant le feed)  
2. **Pas** de SMS / OTP à l’onboarding  
3. **Pas** de nom de famille obligatoire (ni demandé en V1)  
4. **Pas** d’email / mot de passe client V1  
5. **Pas** de compte « actif jusqu’à ce que tu déniches Supprimer » sans bouton clair  
6. **Pas** de re-saisie identité à chaque résa  
7. **Pas** de guest anonymat total au moment où le stock gèle  
8. **Pas** de double collecte (n° à l’arrivée **et** à la résa) — **un** moment : la résa  
9. **Pas** de designer le parcours depuis `Marie Dupont` / `Demo Client`  
10. **Pas** de relitiger Pattern C sous prétexte de « compte »  
11. **Pas** d’utiliser Baymard 18 % pour justifier un mur — c’est l’argument inverse

---

## 7) Critères de succès (2 semaines pilote)

| Métrique | Cible / suivi |
|---|---|
| QR / ouverture → feed vu | **≥ 95 %** (presque aucun mur) |
| Tap Réserver → résa créée | **≥ 92 %** (déjà verdict OTP) |
| Abandon sur écran prénom+n° | Suivi ; alerte si **&gt; 8 pts** vs abandon offre seule |
| % résas avec téléphone fourni | Suivi ; alerte si **&lt; 70 %** malgré copy claire |
| 2ᵉ résa sans re-saisie | Suivi (preuve que le soft profile sert) |
| Suppressions de compte | Doivent être **faciles** et rares |

---

## 8) Décision d’implémentation

1. Laisser découverte **sans compte** (PRODUCT.md)  
2. Sur 1ʳᵉ résa : formulaire **prénom + téléphone (skippable)** ; créer soft user id  
3. Brancher Pattern C sur ce soft user id (sinon l’escalade OTP ne peut pas vivre)  
4. Profil : édition + **Supprimer mon compte**  
5. Nettoyer seeds / fallback `Demo Client` pour la démo fondateur  
6. Revenir devant le Juge seulement si l’abandon prénom+n° dépasse le seuil — pas sur une capture d’inbox seedée

---

*Juge produit — Épicerie Club*  
*Sources : `04-diable-compte.md`, `05-ange-compte.md`, `03-verdict-juge.md`, code `OfferDetailClient.tsx` / `seed.ts` / `profil/page.tsx`*
