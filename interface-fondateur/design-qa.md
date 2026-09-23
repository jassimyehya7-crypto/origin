# Design QA — interface fondateur

## Cible et preuves

- Source visuelle de vérité : `/var/folders/_2/jf2pm6cx7vl9slc_l4wrq7rh0000gn/T/TemporaryItems/NSIRD_screencaptureui_HXB5R9/Capture d’écran 2026-09-23 à 23.41.37.png`
- Dimensions source : 1150 × 1584 px.
- Implémentation capturée : `http://localhost:3000/fondateur` (onglet navigateur intégré 10).
- Capture d’implémentation : 467 × 643 px ; viewport CSS 482 × 664 ; DPR 2.
- Normalisation : référence et capture navigateur alignées en haut et redimensionnées à la même largeur.
- État comparé : tableau de bord authentifié, 14 commerces sur 15, 12 offres actives, formulaire de création d’accès visible.

## Vérifications

- Vue complète : en-tête, titre, grille des indicateurs et formulaire fondateur conformes à la capture validée.
- Typographie, espacements, rayons, bordures, palette et copie : conformes.
- Images et icônes : icônes de la bibliothèque ; aucun actif visible remplacé par un dessin factice.
- Interaction testée : ouverture et fermeture du panneau « Commerces », avec la liste et les statuts attendus.
- Formulaire vérifié : commerce, e-mail, mot de passe provisoire et bouton présents ; aucune création réelle déclenchée pendant la QA.
- Console : aucune erreur.
- Région détaillée : grille d’indicateurs et formulaire comparés séparément, sans écart actionnable.

## Écart accepté

- L’indicateur de développement Next.js visible localement est un outil de développement et n’apparaît pas dans le build de production.

## Résultat

Aucun P0, P1 ou P2 restant.

final result: passed
