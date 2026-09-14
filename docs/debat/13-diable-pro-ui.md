# Diable — Pro UI (auto-clôture + 3 onglets)

**Tribunal :** Yehya veut Pro simplifiée. UX Épuré : 3 onglets + fin de journée **100 % auto** à l’horaire (plus de parcours Clôture manuel).  
**Rôle :** CONTRE. Pas de verdict.

## Attaques (priorité)

1. **Auto-clôture ≠ no-show.** Verdict no-show : `Pas venue` = **tap Pro**. Un cron « Terminer à 19h » qui marque `NON_RECUPEREE` sur les codes non scannés = Pattern C sur des clients qui sont venus (Pro n’a pas tapé). Mesure la compliance Pro, pas l’honneur client — déjà combattu dans `07-diable-noshow.md`.
2. **Si l’auto met tout en Expirée :** stock rendu OK, mais **zéro signal** no-show réel → Pattern C aveugle, commerçant brûlé sans rail. L’auto ne peut pas à la fois être sûre *et* discipliner.
3. **3 onglets qui enterrent.** Fusion Aujourd’hui + Résas + suppression Clôture = plus d’endroit où décider Récupérée / Pas venue / Expirée. « Simplifier » en enlevant la seule revue honnête.
4. **Suppressions dangereuses.** Sans Clôture manuelle + sans undo 30 s sur `NON_RECUPEREE`, un gros bouton / un cron = OTP le lendemain sur un innocent. Refuser ≠ Pas venue ≠ Expirée : trois outcomes, pas un « Fini ».
5. **Offres / Publier à 1 tap.** Si le 3ᵉ onglet mange Mes offres, le commerçant ne republie pas — cold start B2B.

## Garde-fou minimal (sans trancher)

Auto à l’horaire **seulement** → `EXPIREE` (stock rendu, **zéro strike**). `NON_RECUPEREE` **uniquement** sur tap Pro. Garder une revue 10 s des codes non scannés *ou* accepter de ne jamais auto-punir.
