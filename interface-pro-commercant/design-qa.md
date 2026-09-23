# Design QA — interface pro commerçant

## Cible et preuves

- Source visuelle de vérité : `/var/folders/_2/jf2pm6cx7vl9slc_l4wrq7rh0000gn/T/TemporaryItems/NSIRD_screencaptureui_V0FHRK/Capture d’écran 2026-09-23 à 23.26.15.png`
- Dimensions source : 1044 × 1448 px.
- Implémentation capturée : `http://localhost:8082/pro` (onglet navigateur intégré 9, mode démonstration local).
- Capture d’implémentation : 470 × 648 px ; viewport CSS 482 × 664 ; DPR 2,4.
- Normalisation : référence et implémentation alignées en haut et redimensionnées à la même largeur dans la comparaison côte à côte.
- État comparé : Épicerie Da Silva, aucune demande urgente, compteurs à zéro.

## Vérifications

- Vue complète : en-tête, identité du commerce, statut d’ouverture, carte d’état, compteurs et appel à créer une offre conformes.
- Typographie, espacements, rayons, ombres et palette : cohérents avec la capture validée.
- Images et icônes : logo et icônes issus des actifs et de la bibliothèque de l’application.
- Copie : « Tout est sous contrôle », compteurs et libellés conformes.
- Interaction testée : ouverture de « Voir tout » vers `/pro/orders`, puis retour au tableau de bord.
- Console : aucune erreur.
- Région détaillée : carte « Tout est sous contrôle » et compteurs comparés séparément ; aucune dérive actionnable.

## Écarts acceptés

- La capture d’implémentation montre davantage la navigation basse, uniquement parce que le viewport de contrôle est plus court. Le produit et la référence utilisent le même composant fixe.
- Le mode démonstration sert uniquement à la revue visuelle locale ; le démarrage normal conserve l’authentification Supabase.

## Résultat

Aucun P0, P1 ou P2 restant.

final result: passed
