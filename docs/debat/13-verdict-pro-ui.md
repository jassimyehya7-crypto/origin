# Verdict juge — Pro UI (MVP Villeneuve)

**Dossier :** Produit · Commerces · Copy · Couleurs · Cockpit · Ange · Diable · UX Épuré (`12-ia-pro-mobile.md`) · QA checklist · **décision Yehya : fin de journée 100 % auto**  
**Critère :** moins de sections, zéro tech, clôture claire ; pas barbant ; aligné `09` (pas de scan ≠ no-show).

---

## 1) Nav bottom — **3 onglets**

| # | Libellé | Route | Rôle |
|---|---|---|---|
| 1 | **Aujourd’hui** | `/pro` | File à traiter maintenant |
| 2 | **Offres** | `/pro/offres` | Liste + Publier (FAB / bouton haut) |
| 3 | **Magasin** | `/pro/parametres` | Réglages (horaire de fin, etc.) |

Desktop sidebar = **mêmes 3**.  
**Pas** d’onglet Clôture. **Pas** d’item « Créer une offre » séparé (vit dans Offres). **Pas** d’onglet Réservations (fusionné dans Aujourd’hui).

---

## 2) Contenu **Aujourd’hui**

Une seule file, **deux sections** collées :

1. **À confirmer (n)** — `EN_ATTENTE`  
2. **À retirer** — `CONFIRMEE` non récupérées  

Header : nom commerce · « N à traiter ».  
Sous-ligne muted : **« Se termine à HH:MM »** (`openUntil`).

### Garde-fou Diable (retenu) — ne pas noyer Confirmer

- **Pas** de CTA « Publier » primaire sur Aujourd’hui (évite 2 jobs dans le même scroll au rush).  
- Publier = **1 tap** via onglet **Offres** (Diable #4 + UX).  
- Cockpit : **Stock live** + **Retraits du jour** = **chips secondaires** d’une ligne sous le header (≤1 tap d’info, pas une 2ᵉ file) — pas la grille KPI 3 cases.

Empty : « Rien à traiter » + lien secondaire « Voir les offres ».  
Après HH:MM : état « **Journée terminée · reprise demain** ».

---

## 3) Parcours fin de journée

### Décision Yehya (binding) — **100 % auto à l’horaire boutique**

| | |
|---|---|
| **Déclencheur** | `openUntil` (heure magasin) — job auto |
| **Libellé UI** | Pas de bouton primaire « Clôturer ». Copy visible : « Se termine à HH:MM » / après « Journée terminée » |
| **Effet auto** | Tout `CONFIRMEE` encore ouverte → **`EXPIREE` / « Non retirée »** · stock **rendu** · **0 strike** |
| **`EN_ATTENTE` non tranchées** | Expirent / hors file — **pas** no-show |
| **No-show** | **Uniquement** si Pro tape **Pas venu** *pendant* la journée (`09`) |

### Garde-fous Diable (retenus)

| # | Garde-fou | Implémentation |
|---|---|---|
| 1 | Ne pas mélanger Refuser / fin de journée / Pas venu | Trois outcomes, trois contrôles distincts — auto soir ≠ Pas venu |
| 2 | Stock fantôme | Job auto = restore stock atomique ; log fondateur si restore fail |
| 3 | Pas venu trop facile | **Undo 30 s** toast + **correctif 24 h** (reclasse `NON_RECUPEREE` → `RECUPEREE`, retire strike) |
| 4 | Offres à 1 tap | Onglet Offres toujours en nav |
| 5 | Fin de journée visible | Heure affichée ; **pas** auto « aveugle » sans HH:MM à l’écran |

**Amendement vs Ange / Produit « 1 bouton Fini » :** bouton manuel primaire **supprimé** (Yehya). Diable « revue codes obligatoire » → **partiellement** : la revue = file **À retirer** *dans la journée* ; à l’heure = expire sans strike (pas de NON_RECUPEREE de masse).

Magasin : champ **Heure de fin** seulement — **pas** de CTA « Clôturer ».  
Route `/pro/cloture` : **déprécier** (redirect → Aujourd’hui).

---

## 4) Liste **SUPPRESSIONS**

1. Onglet / item **Clôture** (nav mobile + sidebar)  
2. Onglet / item **Réservations** (fusion → Aujourd’hui)  
3. Grille **KPI** Accueil (Offres / Aujourd’hui / Retraits en 3 cards)  
4. CTA **« Publier une offre »** sur `/pro`  
5. Liens bas « Clôture du soir → » / « Toutes les réservations → »  
6. Item sidebar **« Créer une offre »** séparé  
7. Libellé **« Tableau de bord »** → remplacé par **Aujourd’hui**  
8. Bouton primaire **« Clôturer / Terminer la journée »** (manuel)  
9. `window.confirm` / sheet de clôture manuelle  
10. Emoji / VisualMark emoji côté Pro → **initiale lettre**  
11. Jargon : Clôture, EN_ATTENTE, EXPIREE brut, NON_RECUPEREE brut  
12. Filtres / historique du jour sur la file (historique = plus tard, Magasin)

---

## 5) Libellés boutons **finaux**

### Demandes (`EN_ATTENTE`)

| Action | Libellé UI | Effet |
|---|---|---|
| Confirmer | **Oui, c’est réservé** | → `CONFIRMEE` · primaire **Jaune** |
| Refuser | **Non, plus dispo** | → `REFUSEE` · **outline** (pas rouge plein) |

Section : **À confirmer (n)** (plus « En attente »).

### Retraits (`CONFIRMEE`)

| Action | Libellé UI | Effet |
|---|---|---|
| OK | **Récupérée** | → `RECUPEREE` |
| No-show | **Pas venu** | → `NON_RECUPEREE` + strike · **undo 30 s** |

### États / soir (copy)

| Interne | Libellé commerçant |
|---|---|
| Clôture | **Fin de journée** (concept) / « Se termine à HH:MM » |
| Expirée (soir auto) | **Non retirée** ou **Terminée** (0 strike) |
| Journée close | **Fini pour aujourd’hui** / « Journée terminée · reprise demain » |


**Libellés Ange « Accepter / Refuser » :** non retenus — Commerces / Copy Villeneuve : **Oui, c’est réservé** / **Non, plus dispo** (plus clairs au comptoir).
### Couleurs (retenu)

- **1 primaire Jaune** = « Oui, c’est réservé »  
- Refuser = outline  
- Rouge = **pastille** statut seulement (pas gros bouton)

---

## 6) Synthèse pour implémentation (ordre)

1. `ProSidebar` / `ProMobileNav` → 3 items  
2. `/pro` → À confirmer + À retirer + « Se termine à HH:MM » + chips stock/retraits  
3. Libellés boutons ci-dessus + undo 30 s sur Pas venu  
4. Job auto `openUntil` → `EXPIREE` + restore stock (0 strike)  
5. Purge suppressions §4 ; déprécier `/pro/cloture`  
6. QA : `docs/QA-PRO-CHECKLIST.md` — GO si 8/8 (check 7 = fin de journée **auto** compréhensible, plus bouton manuel)

---

*Juge produit — tribunal Pro UI clos*  
*Yehya auto-horaire · Diable garde-fous 1–5 · UX 3 onglets · Ange inbox+offres (sans bouton Fini)*
