# Design QA — interface client

## Cible et preuves

- Source visuelle de vérité : `/var/folders/_2/jf2pm6cx7vl9slc_l4wrq7rh0000gn/T/TemporaryItems/NSIRD_screencaptureui_sOXwof/Capture d’écran 2026-09-23 à 23.26.45.png`
- Dimensions source : 1152 × 1562 px.
- Implémentation capturée : `http://localhost:8081/` (onglet navigateur intégré 8).
- Capture d’implémentation : 467 × 643 px ; viewport CSS 482 × 664 ; DPR 2.
- Normalisation : la référence et la capture navigateur ont été placées côte à côte dans des colonnes de même largeur, alignées en haut. Les différences de densité et de hauteur de fenêtre ont été ignorées.
- État comparé : Villeneuve, catégorie « Tout », après synchronisation Supabase, affichage nocturne avec « Nouveau aujourd’hui » puis « On se revoit demain ! ».

## Vérifications

- Vue complète : composition, ordre des blocs, cartes, navigation fixe et densité conformes à la référence.
- Typographie : même hiérarchie, graisse et rythme visuel ; aucun retour à la ligne bloquant.
- Espacement : en-tête, recherche, catégories, rail des nouveautés et bannière nocturne alignés avec la référence.
- Couleurs : fond ivoire, lime, corail, gris et contraste conformes aux tokens visibles.
- Images et icônes : vraies photos du catalogue et icônes de la bibliothèque, sans remplacement par des formes factices.
- Copie : libellés, prix, distances et état « Fermé · Reprend à » conformes.
- Interaction testée : ouverture de la recherche puis retour à l’accueil.
- Console : aucune nouvelle erreur après le correctif d’hydratation et un rechargement suivi de 6 secondes de synchronisation.
- Région détaillée : le rail « Nouveau aujourd’hui » a été comparé séparément car il concentre images, remises, prix, distances et état du commerce.

## Historique des corrections

1. **P1 — accueil vide après synchronisation**
   - Avant : un catalogue Supabase vide ou expiré remplaçait la version validée.
   - Correction : le catalogue validé reste la base ; les commerces et offres Supabase valides sont ajoutés sans l’effacer. Le stockage client a aussi été séparé de l’ancienne application combinée.
   - Après : les trois cartes « Nouveau aujourd’hui » restent visibles avant et après la synchronisation.
2. **P2 — incohérence d’hydratation**
   - Avant : l’heure réelle et les données distantes pouvaient changer l’ordre des cartes pendant l’hydratation.
   - Correction : snapshot serveur stable avec bascule vers l’heure navigateur après hydratation.
   - Après : rechargement propre, écran stable et aucune nouvelle erreur console.

## Résultat

Aucun P0, P1 ou P2 restant. Les sections diurnes « Flash », « Nouveau aujourd’hui » et « À saisir près de vous » restent pilotées par les horaires ; l’état nocturne comparé masque normalement les Flash.

final result: passed
