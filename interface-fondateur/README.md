# Interface fondateur

Tableau de bord avancé OffresLocal correspondant à l’interface validée sur `http://localhost:3000/fondateur`.

## Lancer

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Fonctions conservées

- authentification et vérification du rôle fondateur;
- indicateurs clients, commerces, offres et réservations;
- création d’un accès commerçant lié à un commerce;
- suivi des messages commerçants;
- gestion des abonnements et demandes de tablette;
- actualisation périodique et temps réel Supabase.

Le menu latéral relie l’interface client et l’interface pro avec `NEXT_PUBLIC_CLIENT_APP_URL` et `NEXT_PUBLIC_PRO_APP_URL`.

## Backend partagé

Le dossier `supabase` de cette application est l’unique source pour les migrations et la fonction Edge `merchant-accounts`. Les applications client et pro consomment le même projet Supabase sans dupliquer le code serveur.

## Vérifier

```bash
npm run build
```
