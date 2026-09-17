# Registre MVP — Page Réserver + confirmation (Villeneuve)

**Date :** 2026-09-14  
**Sources :** Yehya + tribunal (`10-verdict-page-reserver.md`) + UX Épuré + Copy Client + Couleurs & Marque  
**Code :** `df1c28f` (UI/règles) → `6590bbb` (SMS seven.io)

---

## A. Règles produit (Juge + Yehya) — verrouillées

| # | Règle | Statut code |
|---|---|---|
| 1 | Browse libre ; tél. **CH obligatoire** au gel stock (plus skippable) | ✅ API + form |
| 2 | Prénom **≥ 3 lettres** (1–2 bloqués) ; authenticité secondaire | ✅ |
| 3 | **qty = 1** forcé UI + API (pas de sélecteur) | ✅ |
| 4 | SMS **post-résa** : code `EC-xxxx` + lien `/reservations` — **pas OTP** | ✅ seven.io |
| 5 | Surcharge Pattern C skippable (`03`/`06`) pour MVP fondateur | ✅ doc `10` |

Provider SMS : **seven.io** (`SEVEN_API_KEY`, `SEVEN_FROM=OffresLocal`).

---

## B. Design page offre `/offre/[id]` (UX + Copy + Couleurs)

1. Hero photo (lightbox) ; **pas** badge Dernière chance / type sur cette page  
2. H1 offre  
3. Bloc deal : `−XX%` **Rouge #EB4A3F** text bold + prix Encre + barré Mute (pas pastille rouge)  
4. Stock live wow : « Encore N » / « Dernière » ; Vert `#0CAF68` ; **Jaune Club** seulement si ≤2  
5. Meta muted : distance · adresse · Jusqu’à HH:MM  
6. **Pas d’À propos** (commerçant n’écrit pas)  
7. 3 puces confiance inchangées : Frais/local · Retrait magasin · Résa gratuite · code  
8. Form : qty fixe 1 (« 1 promo par personne ») ; label **Prénom** ; tél. requis  
9. Sticky **Réserver** Jaune Club `#EAFF4F` + Encre  

Copy : `Demande envoyée` / `En attente du commerce…` côté conf ; CTA `Mes réservations` / `Autres offres`.

---

## C. Confirmation

- Bande jaune 4px haut de carte (signature rare)  
- Code EC Encre mono XL, bordure tiretée Règle, fond Papier  
- Ligne « SMS envoyé au … »  
- Badge EN ATTENTE  
- Photo offre si dispo  
- Actions : Mes réservations / Autres offres / Annuler (pending)

---

## D. Agents ayant contribué

- Ange produit / Avocat du diable / **Juge produit** → verdict `10`  
- UX Épuré / Copy Client / Couleurs & Marque → structure + copy + tokens  
- Chef de cabinet → orchestration + push `main`

---

## E. À ne pas rouvrir sans nouveau tribunal

- Remettre tél. skippable  
- Accepter prénom 1–2 lettres  
- Qty > 1 en V1  
- OTP à chaque résa  
- Remettre « À propos » / Dernière chance sur la fiche résa  

