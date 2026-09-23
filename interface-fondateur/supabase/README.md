# Backend Supabase partagé

Ce dossier relie les trois interfaces au même backend.

## Contenu

- `migrations/` : historique complet et ordonné pour recréer les tables, politiques RLS, stockage des photos, abonnements, demandes de tablette, messages, réservations atomiques et rôles.
- `functions/merchant-accounts/index.ts` : actions serveur sensibles pour les comptes et le pilotage fondateur.

Les migrations doivent être appliquées dans l’ordre de leur préfixe. Les deux dernières ajoutent les opérations atomiques ainsi que les comptes gérés par le fondateur au socle créé par les migrations précédentes.

## Déploiement

Depuis `interface-fondateur`, avec le CLI Supabase connecté au bon projet :

```bash
supabase db push
supabase functions deploy merchant-accounts
```

La fonction doit recevoir `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` dans son environnement serveur. La clé `service_role` ne doit jamais être copiée dans les fichiers `.env.local` des interfaces navigateur.

Après déploiement, renseigner la même URL et la même clé publique dans les trois interfaces.
