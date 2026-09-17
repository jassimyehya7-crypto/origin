# Grille copy — app client OffresLocal

Zone : **Villeneuve**. Style : marché éditorial suisse — direct, jamais jargon.  
Objectif : attirer, décider en quelques secondes.  
Ordre de lecture : **prix → distance → heure → stock → un verbe**.

---

## Mots qui convertissent

| Intention | Préférer | Pourquoi |
|-----------|----------|----------|
| Action | `Réserver`, `Retirer`, `À récupérer` | Verbe = décision |
| Lieu | `Villeneuve`, nom du commerce + rue | Confiance locale |
| Temps | `Aujourd’hui`, `Ce soir`, `Jusqu’à 19h` | Concret, pas « bientôt » |
| Stock | `Encore 2`, `3 restants`, `Dernière` | Urgence douce, vrai |
| Prix | `CHF X.–` puis prix barré | Chiffre avant adjectif |
| Remise | `-30%` | Court, scannable |
| Distance | `À 4 min`, `Près de chez toi` | Utile sans carte mentale |
| Gratuit | `Réservation gratuite` (si vrai) | Clarifie le deal |
| Empty | `Rien pour ce filtre` + `Voir tout` | Honnête + sortie |

### Formules types (cartes / CTA)

- `Réserver`
- `À retirer aujourd’hui`
- `{commerce} · {adresse}`
- `{n} restant(s)` / `Épuisée`
- `Valable jusqu’à {heure}`
- Pied de page utile : `Réservation gratuite · Pas de paiement en ligne · Retrait en magasin`

---

## Mots à couper

| Couper | Remplacer par |
|--------|----------------|
| Découvrir / Explorer / Expérience / Univers | Le produit + le commerce |
| Marketplace / Plateforme / Écosystème / Community | Rien — ou le commerce nommé |
| Opportunité / Exclusive / Unique | Stock ou heure réelle |
| En savoir plus / Voir plus / Cliquez ici | `Réserver` ou le détail utile |
| Optimisé / Smart / Digital / Seamless | Rien |
| Nos partenaires | Le nom du commerce |
| Longue réassurance avant le prix | Prix d’abord |
| Emojis décoratifs sans sens | Emoji produit / commerce seulement |
| `Offres près de vous` (vague) | `À Villeneuve aujourd’hui` ou `{n} offres · à retirer` |
| `Rechercher un produit, un commerce…` (long) | `Produit ou commerce` |

---

## Avant → après (écrans actuels)

| Écran | Aujourd’hui | Proposition |
|-------|-------------|-------------|
| Accueil H2 | Offres près de vous | À Villeneuve aujourd’hui |
| Accueil sous-titre | {n} offres · à retirer aujourd’hui | OK — garder |
| Search placeholder | Rechercher un produit, un commerce… | Produit ou commerce |
| Carte CTA | Réserver | OK — garder |
| Carte meta | Valable aujourd’hui · {n} {unit}s dispo | Aujourd’hui · encore {n} |
| Stock bas | {n} restant(s) | OK — garder |
| Empty titre | Aucune offre pour ce filtre | Rien pour ce filtre |
| Empty corps | Revenez plus tard ou changez de catégorie. | Changez de catégorie, ou revenez plus tard. |
| Empty lien | Voir tout | OK — garder |
| Section shops | Commerces Villeneuve | OK — garder |
| Pied | Réservation gratuite · Pas de paiement en ligne · Retrait en magasin | OK — garder (ordre déjà bon) |

---

## Règles d’écriture

1. **Une idée par ligne.** Pas de phrase marketing avant le chiffre.
2. **Verbe d’action unique** sur le CTA primaire.
3. **Nommer Villeneuve et le commerce** plutôt que « près de vous / partenaires ».
4. **Stock et heure = faits**, pas adjectifs.
5. **Couper tout ce qui n’aide pas à réserver ou retirer.**

---

## Audit post-restyle

À appliquer juste après le restyle UI :

- [ ] Accueil (titre, search, empty, pied)
- [ ] Carte offre
- [ ] Fiche offre + CTA
- [ ] Réservation / confirmation
- [ ] Favoris / nav bas

Owner copy : Copy Client. Coordination : Chef de cabinet.
