# Checklist QA Pro — post-simplification

**Cible** : `/pro` (inbox), `/pro/reservations`, `/pro/cloture`  
**Règle** : 8 checks max · PASS / FAIL + note courte  
**Critères mission** : touch ≥ 44 px · contraste AA · **1 CTA primaire** visible · Confirmer/Refuser clair · fin de journée sans ambiguïté

| # | Check | Où | PASS si… |
|---|-------|-----|----------|
| 1 | **Touch Confirmer / Refuser** | Inbox `/pro` + `/pro/reservations` | Boutons ≥ 44×44 (cible `h-14`) · gap ≥ 8 px · pas de zone morte |
| 2 | **1 CTA primaire par écran** | `/pro`, résas, clôture | Un seul accent décisif (Jaune/Encre ou Confirm) · le reste secondaire (bordure/mute) · pas de 2 jaunes concurrents |
| 3 | **Contraste badges & libellés** | Cartes résa, toasts, erreurs | Encre sur Vert/Soft/Jaune ≥ 4.5:1 · Mute lisible · pas de `#eef3ff` / amber hors palette sur chrome |
| 4 | **Parcours Confirmer** | Carte EN_ATTENTE | Tap Confirmer → statut Confirmée (ou toast) · busy « … » · pas de double-submit · client/qty/code restés lisibles |
| 5 | **Parcours Refuser** | Même carte | Tap Refuser → hors file à traiter · feedback immédiat · irréversible ou confirmé clairement |
| 6 | **Hiérarchie carte résa** | Inbox | Nom → tel → qty×offre → code/heure · Confirmer/Refuser sous la carte · **pas** d’actions secondaires qui volent l’attention |
| 7 | **Fin de journée (Clôture)** | `/pro/cloture` | Titre « Fin de journée / Clôture » · compteur confirmées sans retrait · action de clôture unique et compréhensible · empty state sans jargon |
| 8 | **Zéro ambiguïté état du jour** | `/pro` ↔ clôture ↔ résas | À traiter vs déjà tranché vs à clôturer distincts · empty « rien à faire » explicite · lien retour sans perte de contexte |

## Verdict

- **GO Pro** si 8/8 PASS  
- **NO-GO** si FAIL sur 1, 2, 4, 5 ou 7  

Livrable audit : cocher ici + 1 ligne d’écart (écran · trouvé · attendu) dans `docs/AUDIT-QA-PRO.md` quand la passe est lancée.
