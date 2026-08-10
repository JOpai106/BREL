# Cahier des Charges Détaillé : BREL MONITOR A1

## 1. Introduction et Vision du Projet
**BREL MONITOR A1** est une solution logicielle sur mesure conçue pour **Brel Energie**. Son but est de transformer la maintenance réactive en maintenance proactive et prédictive pour les parcs de groupes électrogènes.

L'application agit comme un "cerveau central" qui suit l'usure de chaque composant critique, calcule avec précision les échéances de maintenance, optimise le stock de pièces détachées et garantit une disponibilité maximale de l'énergie pour les clients finaux.

---

## 2. Architecture Technique et Stack
- **Environnement :** Web Progressif (PWA) - Accessible sur mobile et PC.
- **Frontend :** React 19, Vite, TypeScript (typage strict pour zéro erreur d'exécution).
- **Styling :** Tailwind CSS avec une charte graphique "Industrial-Modern" (Haute lisibilité, contrastes forts, thème clair professionnel).
- **Backend & Database :** Google Firebase (Firestore) - Base de données NoSQL temps réel.
- **Authentification :** Firebase Auth.
- **Hébergement :** Cloud Run (Infrastructure Google Cloud).

---

## 3. Gestion des Rôles et Permissions
### 3.1 Administrateur (Full Access)
- Gestion des utilisateurs (Création, suppression, modification des rôles).
- Paramétrage global (Tarifs de l'huile, seuils d'alerte).
- Validation finale et édition des devis, factures et documents.
- Gestion complète du stock et inventaire.

### 3.2 Technicien (Field Ops)
- Saisie et mise à jour des index d'heures des machines.
- Enregistrement des interventions de maintenance (vidange, filtres, courroies, batterie, AVR, etc.).
- Déduction automatique des pièces du stock central.
- Consultation du planning et carte des sites.

### 3.3 Client (Consultation)
- Vue "Lecture Seule" de son propre parc de machines.
- Téléchargement des rapports d'intervention et fiches techniques PDF.
- Suivi en temps réel de l'état de santé de ses groupes électrogènes.

---

## 4. FORMULES ET DÉTAILS DE CALCULS MATHÉMATIQUES

Cette section détaille de manière exhaustive tous les algorithmes, formules mathématiques et logiques métier exécutés par l'application.

### 4.1 Calculs de Maintenance Préventive - Vidange Moteur (Oil Change)

Pour chaque groupe électrogène, l'application évalue en temps réel l'usure de l'huile moteur à partir de l'index actuel ($I_{\text{actuel}}$), de l'index de la prochaine vidange ($I_{\text{prochaine}}$), de l'index de la dernière vidange ($I_{\text{dernière}}$) et des heures de fonctionnement quotidien estimées ($H_{\text{jour}}$).

1. **Heures Restantes avant Vidange ($H_{\text{restantes}}$) :**
   $$H_{\text{restantes}} = I_{\text{prochaine}} - I_{\text{actuel}}$$

2. **Jours Restants Estimés ($J_{\text{restants}}$) :**
   $$J_{\text{restants}} = \begin{cases} \max\left(0, \frac{H_{\text{restantes}}}{H_{\text{jour}}}\right) & \text{si } H_{\text{jour}} > 0 \\ 0 & \text{si } H_{\text{jour}} \le 0 \end{cases}$$

3. **Date Projetée de Vidange ($D_{\text{projetée}}$) :**
   $$D_{\text{projetée}} = \text{Date Actuelle} + \lceil J_{\text{restants}} \rceil \text{ jours}$$
   *(Affichée au format local `JJ/MM/AAAA`. Si $J_{\text{restants}}$ est indéfini ou non positif, la date affiche `"N/A"`).*

4. **Cycle Total de Vidange ($C_{\text{total}}$) :**
   $$C_{\text{total}} = I_{\text{prochaine}} - I_{\text{dernière}}$$

5. **Heures Consommées dans le Cycle ($C_{\text{utilisé}}$) :**
   $$C_{\text{utilisé}} = I_{\text{actuel}} - I_{\text{dernière}}$$

6. **Pourcentage d'Usure / Progression Vidange ($P_{\text{vidange}}$) :**
   $$P_{\text{vidange}} = \begin{cases} \min\left(100, \max\left(0, \frac{C_{\text{utilisé}}}{C_{\text{total}}} \times 100\right)\right) & \text{si } C_{\text{total}} > 0 \\ 0 & \text{si } C_{\text{total}} \le 0 \end{cases}$$

7. **Règles de Priorité et Niveau d'Alerte :**
   - **Priorité Haute / Critique (Rouge - `high`) :**
     $$H_{\text{restantes}} \le 50\text{ h} \quad \text{ou} \quad I_{\text{actuel}} \ge I_{\text{prochaine}}$$
     *(Active l'indicateur visuel d'urgence et le signal clignotant).*
   - **Priorité Moyenne / Attention (Orange - `medium`) :**
     $$50\text{ h} < H_{\text{restantes}} \le 150\text{ h}$$
   - **Priorité Basse / Conforme (Vert - `low`) :**
     $$H_{\text{restantes}} > 150\text{ h}$$

---

### 4.2 Calculs de Maintenance - Courroie de Distribution / Alternateur (Belt)

L'usure de la courroie suit un cycle standard de **1000 heures de fonctionnement**.

1. **Index de Prochaine Courroie ($I_{\text{courroie\_prochaine}}$) :**
   Si non renseigné, la valeur par défaut est calculée par :
   $$I_{\text{courroie\_prochaine}} = I_{\text{dernière}} + 1000$$

2. **Heures Restantes Courroie ($H_{\text{courroie\_restantes}}$) :**
   $$H_{\text{courroie\_restantes}} = I_{\text{courroie\_prochaine}} - I_{\text{actuel}}$$

3. **Jours Restants Courroie ($J_{\text{courroie\_restants}}$) :**
   $$J_{\text{courroie\_restants}} = \begin{cases} \max\left(0, \frac{H_{\text{courroie\_restantes}}}{H_{\text{jour}}}\right) & \text{si } H_{\text{jour}} > 0 \\ 0 & \text{si } H_{\text{jour}} \le 0 \end{cases}$$

4. **Date Projetée Courroie ($D_{\text{courroie\_projetée}}$) :**
   $$D_{\text{courroie\_projetée}} = \text{Date Actuelle} + \lceil J_{\text{courroie\_restants}} \rceil \text{ jours}$$

5. **Cycle Total Courroie ($C_{\text{courroie\_total}}$) :**
   $$C_{\text{courroie\_total}} = I_{\text{courroie\_prochaine}} - I_{\text{courroie\_dernière}}$$

6. **Pourcentage d'Usure Courroie ($P_{\text{courroie}}$) :**
   $$P_{\text{courroie}} = \begin{cases} \min\left(100, \max\left(0, \frac{I_{\text{actuel}} - I_{\text{courroie\_dernière}}}{C_{\text{courroie\_total}}} \times 100\right)\right) & \text{si } C_{\text{courroie\_total}} > 0 \\ 0 & \text{si } C_{\text{courroie\_total}} \le 0 \end{cases}$$

---

### 4.3 Logique de Mise à Jour Automatique lors d'une Intervention

Lorsqu'une intervention est enregistrée à un index $I_{\text{interv}}$ :

1. **Si l'intervention est de type Vidange (`Vidange Complete` ou `Vidange Partiale`) :**
   - Index dernière vidange : $I_{\text{dernière}} \leftarrow I_{\text{interv}}$
   - Date dernière vidange : $D_{\text{dernière}} \leftarrow \text{Date de l'intervention}$
   - Index prochaine vidange : $I_{\text{prochaine}} \leftarrow I_{\text{interv}} + 250\text{ h}$
   - Index actuel machine : $I_{\text{actuel}} \leftarrow \max(I_{\text{actuel}}, I_{\text{interv}})$

2. **Si l'intervention est de type Courroie (`Courroie`) :**
   - Index dernier changement courroie : $I_{\text{courroie\_dernière}} \leftarrow I_{\text{interv}}$
   - Index prochain changement courroie : $I_{\text{courroie\_prochaine}} \leftarrow I_{\text{interv}} + 1000\text{ h}$
   - Index actuel machine : $I_{\text{actuel}} \leftarrow \max(I_{\text{actuel}}, I_{\text{interv}})$

---

### 4.4 Logique de Déduction Automatique du Stock

Lors du de la validation d'une intervention sur une machine :

1. **Vidange Moteur :**
   - **Quantité d'Huile :** $Q_{\text{huile\_stock}} \leftarrow \max\left(0, Q_{\text{huile\_stock}} - Q_{\text{huile\_machine}}\right)$
   - **Filtre à Huile :** $Q_{\text{filtre\_huile}} \leftarrow \max\left(0, Q_{\text{filtre\_huile}} - 1\right)$
   - **Filtre à Gasoil :** $Q_{\text{filtre\_gasoil}} \leftarrow \max\left(0, Q_{\text{filtre\_gasoil}} - 1\right)$

2. **Intervention Filtre à Air :**
   - **Filtre à Air :** $Q_{\text{filtre\_air}} \leftarrow \max\left(0, Q_{\text{filtre\_air}} - 1\right)$

---

### 4.5 Calculs Financiers, Devis et Facturation

1. **Coût Total de l'Huile ($T_{\text{huile}}$) :**
   $$T_{\text{huile}} = Q_{\text{huile}} \times P_{\text{huile\_unitaire}}$$

2. **Montant Total Hors Taxes - Devis / Facture Machine ($T_{\text{HT}}$) :**
   $$T_{\text{HT}} = P_{\text{filtre\_huile}} + P_{\text{filtre\_gasoil}} + P_{\text{filtre\_air}} + P_{\text{décompteur}} + T_{\text{huile}} + P_{\text{main\_oeuvre}}$$
   *(Chaque composant dont le prix est nul ou négatif est comptabilisé à 0).*

3. **Calculs pour Devis Dynamiques / Vierges (Bordereau de prix) :**
   Pour un tableau contenant $N$ lignes d'articles avec Quantité ($Q_i$) et Prix Unitaire HT ($P_i$) :
   $$\text{Total Ligne HT}_i = Q_i \times P_i$$
   $$T_{\text{HT\_dynamique}} = \sum_{i=1}^{N} \text{Total Ligne HT}_i$$

4. **Net à Payer ($T_{\text{Net}}$) :**
   $$T_{\text{Net}} = T_{\text{HT}} \quad \text{(en FCFA)}$$

5. **Formatage des Valeurs Numériques :**
   Toutes les valeurs numériques (heures, montants monétaires) sont formatées selon la norme francophone via `Intl.NumberFormat('fr-FR')` (ex: `1 250 h`, `450 000 FCFA`).

---

## 5. Spécifications des Modules Applicatifs

### 5.1 Module Parc Machines & Dashboard
- Dashboard avec cartes interactives (Bento Grid) pour chaque groupe électrogène.
- Barre de recherche instantanée par nom de client, modèle, site ou ID.
- Filtre rapide par niveau d'urgence (Toutes, Critique <=50h, Attention <=150h, Normal >150h).
- Affichage clair de l'index actuel, heures restantes, date projetée et barre de progression dynamique.

### 5.2 Module Devis, Factures & Documents Archives
- Édition en 1 clic de devis et factures personnalisés aux couleurs de Brel Energie.
- Option **Devis Vierge / Dynamique** avec ajout/suppression de lignes et import de bordereaux Excel (`.xlsx`, `.xls`, `.csv`).
- Génération d'**Auto-collants d'entretien** prêts à imprimer pour apposer directement sur les groupes électrogènes sur le terrain.
- Impression directe A4 et export PDF.

### 5.3 Module Carte & Géolocalisation
- Carte interactive Leaflet / OpenStreetMap recensant la position de chaque machine.
- Popups avec indicateurs d'urgence et détails de la machine.

### 5.4 Module Planning & Calendrier
- Vue calendrier des interventions passées et des maintenances prévisionnelles calculées.

### 5.5 Module Gestion de Stock
- Inventaire centralisé avec suivi des quantités d'huile, filtres et consommables.
- Mise à jour manuelle et déduction automatique lors des interventions.

---

## 6. Sécurité et Intégrité des Données
- **Firestore Security Rules :** Isolation stricte des données entre clients et administrateurs/techniciens.
- **Data Validation :** Prévention contre la saisie d'index incohérents ou de valeurs négatives.
- **Exportation :** Exportation CSV complète du parc de machines à tout moment.
