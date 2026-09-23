# OffresLocal

Le dépôt contient uniquement les trois interfaces actuelles d’OffresLocal.

| Dossier | Interface | URL locale |
| --- | --- | --- |
| `interface-client` | Application publique validée | `http://localhost:8081/` |
| `interface-pro-commercant` | Espace commerçant validé | `http://localhost:8082/pro` |
| `interface-fondateur` | Tableau de bord fondateur validé | `http://localhost:3000/fondateur` |

## Démarrage

Chaque interface est autonome et possède son propre `package.json`.

```bash
cd interface-client
npm install
cp .env.example .env.local
npm run dev
```

```bash
cd interface-pro-commercant
npm install
cp .env.example .env.local
npm run dev
```

```bash
cd interface-fondateur
npm install
cp .env.local.example .env.local
npm run dev
```

## Connexions entre les interfaces

```text
Interface client ───────┐
                        ├── Supabase : catalogue, offres, réservations et temps réel
Interface commerçant ───┤
                        └── Edge Function merchant-accounts
Interface fondateur ────┘       ├── création des accès commerçants
                                ├── changement initial de mot de passe
                                └── pilotage des messages, abonnements et tablettes
```

- Le client et le commerçant partagent les mêmes tables `ec_*`; une réservation client apparaît donc dans l’espace commerçant.
- Le fondateur crée les comptes commerçants avec la fonction serveur `merchant-accounts`.
- L’espace commerçant vérifie l’association entre l’utilisateur connecté et son commerce.
- Les liens du menu fondateur pointent vers les ports `8081` et `8082` via les variables d’environnement documentées.
- Les migrations et la fonction Edge ont une seule source de vérité : `interface-fondateur/supabase`.

## Sécurité

Les trois navigateurs utilisent uniquement la clé Supabase publique. La clé `service_role` n’est jamais exposée dans une variable `VITE_*` ou `NEXT_PUBLIC_*`; elle reste dans l’environnement serveur de la fonction Edge.

Chaque dossier contient son propre README avec les routes, les variables et les commandes de vérification.
