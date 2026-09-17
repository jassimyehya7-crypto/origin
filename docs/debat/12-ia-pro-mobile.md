# IA Pro mobile — OffresLocal
Date: 2026-09-14 (rév. clôture auto)  
Auteur: UX Épuré  
Contraintes: mobile-first, coins 45°, zéro emoji, simplicité max  
Décision Yehya: **fin de journée 100% automatique à l’horaire**

## 1) Nav bottom — 3 onglets

| Onglet | Route | Rôle |
|---|---|---|
| **Aujourd'hui** | `/pro` | Uniquement ce qu'il faut traiter maintenant |
| **Offres** | `/pro/offres` | Liste + publier |
| **Magasin** | `/pro/parametres` | Réglages (horaire de fin, etc.) |

Pas de 4ᵉ onglet Clôture.  
Desktop sidebar : mêmes 3 destinations. Pas de ligne « Créer une offre » séparée (FAB dans Offres). **Pas** d’entrée Clôture obligatoire dans Magasin.

## 2) Accueil = uniquement la file actionnable

Écran `/pro` = **une seule liste**, deux sections collées :

1. **À accepter** — demandes `EN_ATTENTE` (Accepter / Refuser)
2. **À retirer** — confirmées non récupérées (Récupérée / Pas venue)

Header : nom commerce · « N à traiter ».  
Sous-header info (muted, 1 ligne) : **« Se termine à HH:MM »** (horaire magasin / validité offres).  
Empty state : « Rien à traiter » + CTA secondaire vers Offres.

**Pas sur l'accueil** : KPIs, Publier, bouton Clôture, liens Toutes les résas, filtres, historique.

## 3) Fin de journée — 100% auto

**Pas de geste commerçant pour clôturer.**  
À HH:MM (horaire configuré) le système :

- expire le reste (stock rendu)
- pas de strike no-show automatique ambigu — règles métier déjà définies côté produit
- les offres du jour se ferment

UI :

- Ligne info partout utile : « Se termine à HH:MM »
- Après l’horaire : empty / état « Journée terminée · reprise demain » sur Aujourd'hui
- Magasin : champ **Heure de fin** (réglage), **pas** de bouton « Clôturer »
- Route `/pro/cloture` : déprécier ou rediriger vers Aujourd'hui (écran manuel retiré du parcours)

Pas de bandeau « Clôture du soir », pas de sheet confirm clôture, pas de `window.confirm`.

## 4) On SUPPRIME

- Grille KPI Accueil
- CTA « Publier une offre » sur Accueil
- Lien / bouton Clôture (accueil, nav, Magasin)
- Onglet mobile Clôture + items sidebar « Créer une offre » / « Clôture »
- Emoji Pro → initiale lettre
- Filtres du jour
- Parcours clôture manuelle (`ClotureClient` hors flux)

## Règles UI Pro

- Coins 45° (`ec-corner-cut`) partout
- Un verbe primaire par écran (sur Aujourd'hui : Accepter / Refuser / Récupérée / Pas venue seulement)
- Jaune = action rare / confirm ; nav actif seulement
- Zéro emoji

## Implémentation (ordre)

1. `ProSidebar.tsx` / `ProMobileNav` → 3 items (sans Clôture)  
2. `pro/page.tsx` → file À accepter + À retirer + ligne « Se termine à HH:MM »  
3. Magasin : réglage heure de fin ; **retirer** CTA clôture  
4. Job / logique auto à l’horaire (Produit / backend)  
5. Purge KPIs + liens doublons + déprécier `/pro/cloture` du nav
