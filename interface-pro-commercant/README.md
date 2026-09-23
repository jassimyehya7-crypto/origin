# Interface pro commerçant

Espace commerçant OffresLocal correspondant à l’écran validé. Le serveur local écoute sur `http://localhost:8082` et redirige `/` vers `/pro`.

## Lancer

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sans variables Supabase, l’interface reste disponible en mode démonstration. Avec Supabase, l’accès exige un compte commerçant créé par le fondateur et relié au commerce attendu.

Pour contrôler l’écran validé sans ouvrir de session commerçant :

```bash
npm run dev -- --mode demo
```

Ce mode est réservé à la prévisualisation locale ; le lancement normal conserve l’authentification et les connexions Supabase.

## Parcours conservés

- `/pro` : activité du jour et indicateurs.
- `/pro/orders` : demandes, confirmations et retraits.
- `/pro/offers` : offres publiées.
- `/pro/new` : création d’une offre.
- `/pro/notifications` : alertes commerçant.

Le composant d’accès gère la connexion, l’activation par le fondateur, le changement obligatoire du mot de passe initial et le rafraîchissement temps réel des commandes.

## Vérifier

```bash
npm run typecheck
npm run build:dev
npm run lint
```

La fonction serveur utilisée pour les comptes se trouve dans `../interface-fondateur/supabase/functions/merchant-accounts`.
