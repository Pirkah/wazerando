# 🥾 WazeRando - Le Waze des Randonneurs

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646cff.svg?logo=vite)](https://vitejs.dev/)

> **L'application communautaire de randonnée qui révolutionne vos sorties en montagne et en nature.**  
> Comme Waze sur la route, WazeRando vous guide en direct au niveau de la rue et des sentiers, calcule votre dénivelé en temps réel, et vous alerte des aléas du sentier (patous, sources taries, arbres tombés, belvédères magiques).

---

## 🌟 Points Forts & Fonctionnalités

### 1. 🏎️ Vue Rapprochée Cockpit (Zoom 18.5 "Comme en Voiture")
- **Affichage au niveau de la rue** : zoom immersif à l'échelle maximale pour voir chaque virage, trottoir, passerelle et bifurcation de sentier.
- **Centrage décalé Waze** : le randonneur est positionné dans le tiers inférieur de l'écran pour dégager 75% du champ de vision vers l'avant.
- **Tracé collé aux vraies routes et sentiers** : utilisation du moteur de routage piéton **OSRM**, suivant fidèlement le bitume et les sentiers réels sans couper à travers les immeubles.
- **Instructions avec les vrais noms de voies** : *"Dans 40m : Tourner à droite sur Quai Louis Goujaud"*.

### 2. 📈 Profil Altimétrique Interactif & Dénivelé en Direct
- **Courbe de relief synchronisée** : glisser le doigt sur le profil déplace instantanément un curseur lumineux sur la carte.
- **Métriques en direct** : Dénivelé Positif (D+), Dénivelé Négatif (D-), pourcentage de pente (%) avec coloration dynamique (vert, jaune, rouge).
- **Position des spots** : les alertes et belvédères sont placés directement sur la ligne de crête altimétrique.

### 3. 📢 Système de Signalement Communautaire Temps Réel ("Bouton Waze")
- **Signalement en 1 clic** :
  - 🏔️ **Points de vue / Panoramas** (belvédères, cascades, spots coucher de soleil).
  - ⚠️ **Dangers & Obstacles** (chiens patous de garde, arbres couchés, passages boueux, éboulis).
  - 💧 **Points d'eau & Sources** (eau potable, source tarie ou coulant).
  - ⛺ **Coins Bivouac** & 🥪 **Aires de Pique-nique**.
  - 🛖 **Refuges & Abris d'urgence**.
- **Validation communautaire** : confirmation *"Toujours d'actualité ?"*, système de votes utiles et commentaires en direct.

### 4. 💻 Studio de Préparation sur PC <-> 📱 Application Mobile Terrain
- **Sur PC (Studio de préparation)** :
  - Tracez votre itinéraire point par point sur grand écran à la souris.
  - Calcul instantané du D+ et de la distance sur le réseau routier et piéton.
  - Enregistrez votre rando dans votre compte en 1 clic.
- **Sur Téléphone (Navigation GPS)** :
  - Ouvrez l'application sur le terrain et retrouvez vos randos préparées.
  - Compteur Waze en bas à gauche : vitesse de marche (`km/h`), altitude GPS (`m`) et cap de boussole.
  - Mode hors-ligne et PWA installable sur l'écran d'accueil sans passer par les stores.

### 5. 🗺️ Cartographie Ouverte & 100% Gratuite (Zéro clé API)
- **OpenStreetMap France** : rendu ultra-détaillé en français avec toponymie complète.
- **CyclOSM / Topo Rando** : courbes de niveau et sentiers balisés.
- **Satellite HD** (Esri World Imagery).
- **Zéro frais d'API** et aucune clé requise.

---

## 🛠️ Stack Technique

- **Frontend** : React 18.3, TypeScript, Vite 6, Tailwind CSS.
- **Cartographie** : Leaflet 1.9, Tuiles OpenStreetMap France & CyclOSM.
- **Routage & Altimétrie** : OSRM Pedestrian Routing Engine, Haversine Math Engine.
- **Géocodage** : OpenStreetMap Nominatim API (recherche d'adresses précises).
- **Icons & UI** : Lucide React, Glassmorphism, Tailwind Merge.
- **Persistance & Synchronisation** : LocalStorage réactif avec architecture prête pour Supabase / Firebase.

---

## 🚀 Lancement Rapide (Installation Locale)

### Prérequis
- [Node.js](https://nodejs.org/) version 18 ou supérieure.
- `npm` ou `yarn` ou `pnpm`.

### Installation
```bash
# Cloner le dépôt
git clone https://github.com/Pirkah/wazerando.git
cd wazerando

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application s'ouvre directement sur : **`http://localhost:3000/`**.

### Build de Production
```bash
npm run build
```

---

## 🗺️ Randonnées Intégrées par Défaut

1. **Limoges (Haute-Vienne)** : *Boucle des Bords de Vienne & Pont Saint-Étienne* (6.4 km, D+ 85m).
2. **Limoges Ouest** : *Sentier Botanique de la Forêt des Vaseix* (8.2 km, D+ 145m).
3. **Monts d'Ambazac** : *Chaos Granitique & Pierre Branlante* (11.5 km, D+ 360m).
4. **Chamonix-Mont-Blanc** : *Boucle du Lac Blanc & Aiguille Verte* (8.6 km, D+ 940m).
5. **Importateur GPX universel** : glissez-déposez n'importe quelle trace `.gpx`.

---

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

Créé avec passion par [Pirkah](https://github.com/Pirkah) pour la communauté des randonneurs.
