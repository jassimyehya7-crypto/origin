# Grille d’audit couleurs — OffresLocal

Référence : `BRAND.md` + `DESIGN.md` (`/workspace/offreslocal-brand/offreslocal-client`)  
Cible : `/workspace/offreslocal`  
Règle critique : **Jaune Club `#EAFF4F` rare** — jamais fond de page continu.

## Palette officielle (seule autorisée)

| Rôle | Nom | HEX | Usage attendu |
|---|---|---|---|
| Texte / CTA principal | Encre | `#171B15` | Texte, nav active, boutons principaux |
| Signature | Jaune Club | `#EAFF4F` | Logo, confirmation, nav active, moments décisifs |
| Localisation | Bleu local | `#255CFF` | Distance, géoloc, focus ring |
| Disponibilité | Vert retrait | `#0CAF68` | Succès, stock OK, confirmation retrait |
| Urgence / promo | Rouge offre | `#EB4A3F` | Offre, urgence, prix promo |
| Fond | Papier | `#F5F6F2` | Fond de page |
| Cartes | Surface | `#FFFFFF` | Cards, panels |
| Bordures | Règle | `#DDE1D8` | Borders, separators |
| Secondaire | Mute | `#71776D` | Métadonnées, labels secondaires |

## Checklist par écran / surface

Pour chaque surface : **PASS / FAIL / N/A** + HEX trouvé + correctif.

### Tokens globaux
- [ ] `:root` / Tailwind tokens = palette officielle (pas de verts Material, oranges, teals hors palette)
- [ ] Fond page = Papier `#F5F6F2` (pas jaune, pas vert soft)
- [ ] Texte principal = Encre `#171B15`
- [ ] Texte secondaire = Mute `#71776D`
- [ ] Bordures = Règle `#DDE1D8`
- [ ] Cartes = Surface `#FFFFFF`

### Accents fonctionnels
- [ ] Distance / map / pin user = Bleu `#255CFF`
- [ ] Succès / dispo / confirmed = Vert `#0CAF68`
- [ ] Promo / urgence / like actif = Rouge `#EB4A3F`
- [ ] CTA primaire = Encre + Surface (pas vert)
- [ ] CTA confirmation décisive = Jaune + Encre (usage rare)

### Règle jaune
- [ ] Aucun fond de page / section large en jaune
- [ ] Jaune limité à : marque (logo), nav active, ticket check, confirm réservation, sélection pin
- [ ] Contraste jaune+Encre OK (texte lisible)

### Contraste (WCAG AA cible)
- [ ] Encre sur Papier / Surface ≥ 4.5:1
- [ ] Mute sur Papier / Surface ≥ 4.5:1 (texte) ou ≥ 3:1 (UI)
- [ ] Blanc sur Encre ≥ 4.5:1
- [ ] Encre sur Jaune ≥ 4.5:1
- [ ] Blanc sur Bleu / Vert / Rouge ≥ 4.5:1

### Hors palette (à bannir)
Tout HEX hors des 9 codes ci-dessus = **FAIL** sauf :
- Transparences dérivées des 9 (alpha sur Encre/Bleu/etc.)
- Photos produit (contenu, pas UI)

## Pré-audit actuel (`/workspace/offreslocal` avant restyle)

| Token / usage actuel | HEX trouvé | Attendu | Verdict |
|---|---|---|---|
| Fond (`ec-bg`) | `#F5F7F5` | `#F5F6F2` Papier | FAIL — proche mais incorrect |
| Encre (`ec-ink`) | `#1A2E1F` | `#171B15` | FAIL |
| Vert primaire | `#2E7D32` / `#43A047` / `#66BB6A` | `#0CAF68` seul | FAIL — palette Material green |
| Vert dark / soft | `#0C3E26` / `#E8F5E9` | — | FAIL — hors palette |
| Rouge | `#E53935` / `#C62828` | `#EB4A3F` | FAIL |
| Orange / ambre | `#FB8C00` / `#EF6C00` / `#F9A825` / `#D4A017` | — | FAIL — hors palette |
| Teal / brun / bleu Material | `#00897B` / `#8D6E63` / `#1565C0` | Bleu `#255CFF` si local | FAIL |
| Mute | `#6B7C6E` | `#71776D` | FAIL |
| Line | `#D7E0D8` | `#DDE1D8` | FAIL |
| Jaune Club | absent | `#EAFF4F` rare | FAIL — manquant |
| Bleu local | absent (sauf `#1565C0`) | `#255CFF` | FAIL |

**Synthèse pré-restyle :** l’app est encore sur une identité « vert grocery Material », pas Marché Éditorial. Restyle attendu avant audit final.

## Écrans à auditer (post-restyle)

1. Feed client (`/`)
2. Détail offre (`/offre/[id]`)
3. Favoris, réservations, profil
4. Confirmation / ticket
5. QR commerce (`/q/[shopSlug]`)
6. Bottom nav / Logo
7. Pro (sidebar, offres, inbox) — même palette
8. Fondateur — même palette

## Format de rapport d’écart

```
[ÉCRAN] composant — problème
Trouvé : #XXXXXX (rôle actuel)
Attendu : #YYYYYY (Nom)
Action : remplacer / retirer / limiter jaune
Contraste : OK | FAIBLE (ratio)
```

## Critères de GO

- 0 couleur hors palette sur UI chrome
- 0 fond page jaune
- Jaune ≤ moments signature / décisifs
- Contrastes AA sur textes et CTA
