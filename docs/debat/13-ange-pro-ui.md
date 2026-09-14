# Ange — Pro UI (3 onglets + fin de journée auto)

**Tribunal :** Yehya veut Pro simplifiée. UX Épuré (`12-ia-pro-mobile.md`) : 3 onglets + fin de journée **100 % auto** à l’horaire (plus de bouton Clôturer).  
**Rôle :** POUR confiance commerçant via simplicité soir. Pas de verdict final.  
**Préalable :** verdict no-show `09` — `Pas venue` = tap Pro ; auto sans geste → `EXPIREE` (zéro strike).

---

## Plaidoirie (≤10 lignes)

1. **Nav OK :** **Aujourd’hui / Offres / Magasin** — oui. Trois destinations, zéro 4ᵉ onglet Clôture. Le soir, le commerçant ne cherche pas : il ouvre **Aujourd’hui**.
2. **Libellés :** mots métier seulement — **Accepter / Refuser / Récupérée / Pas venue**. Interdits : statut, sync, workflow, KPI, « clôturer la session ». Header : nom commerce · « N à traiter » · « Se termine à HH:MM ».
3. **Fin de journée auto vs manuel :** **auto à l’horaire = OUI** pour fermer offres + passer le reste non traité en **`EXPIREE`** (stock rendu, **zéro strike**). **`Pas venue` reste un tap Pro** sur la file **À retirer** — c’est la seule preuve no-show (`09`). Pas besoin d’écran / bouton **Clôturer** : la revue honnête vit **dans Aujourd’hui** avant HH:MM.
4. **Quoi supprimer :** onglet/route Clôture, KPIs accueil, CTA Publier sur accueil, filtres du jour, jargon tech, emoji Pro, doublons « Toutes les résas » sur l’home.
5. **Garde-fou ange :** correctif 24 h si mauvais tap Pas venue ; Magasin = seulement heure de fin + essentiel ; Offres garde Publier à 1 tap (cold start B2B).

**Reco claire :** adopter les 3 onglets UX Épuré + auto-horaire, **à condition** que auto ≠ `NON_RECUPEREE`. Discipline magasin = taps Récupérée / Pas venue sur Aujourd’hui ; simplicité = pas de cérémonie Clôture.

---

## Détail pour le Juge

| Sujet | Position ange |
|---|---|
| 3 onglets | **Pour** |
| Bouton Clôturer | **Contre** (redondant si auto + file À retirer) |
| Auto HH:MM → `EXPIREE` | **Pour** |
| Auto HH:MM → `NON_RECUPEREE` | **Contre** (contredit `09`, brûle des innocents) |
| Pas venue manuel | **Pour** — visible, gros tap, sur Aujourd’hui |
| Moins de sections | **Pour** — confiance = il traite vraiment à 19h30 |

Le Diable a raison sur un point : auto-punir = faux no-show. L’ange ne défend pas ça. L’ange défend **enlever la friction UI** sans enlever la **preuve humaine** du no-show.
