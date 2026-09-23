# Interface client

Application publique OffresLocal correspondant à l’écran validé sur `http://localhost:8081/`.

## Lancer

```bash
npm install
cp .env.example .env.local
npm run dev
```

Le catalogue validé reste toujours la base de l’accueil. Avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, l’application y ajoute les nouvelles données publiées dans Supabase et synchronise les réservations, sans remplacer l’écran par un état vide si la base n’est pas encore alimentée.

## Parcours conservés

- `/` : accueil client, recherche, catégories et offres du jour.
- `/explore` : carte et commerces autour de Villeneuve.
- `/offers/:offerId` et `/reserve/:offerId` : détail puis réservation.
- `/confirmation/:reservationId` et `/reservations/:reservationId` : code et suivi.
- `/favorites`, `/profile`, `/settings` : espace personnel.

L’espace commerçant et le tableau de bord fondateur ne sont pas dupliqués ici.

## Vérifier

```bash
npm run typecheck
npm run build:dev
npm run lint
```

Le schéma Supabase partagé est documenté dans `../interface-fondateur/supabase`.
