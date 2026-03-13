# 🎨 Synthèse d'Image 3D - WebGL & Three.js

> Un atelier interactif et complet sur les fondamentaux de la synthèse d'image 3D avec **Three.js**, du rendu aux pipelines GPU.

<div align="center">

![Three.js](https://img.shields.io/badge/Three.js-r182-blue?style=flat-square&logo=three.js)
![WebGL](https://img.shields.io/badge/WebGL-2.0-green?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-7.2-purple?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)

</div>

---

## 📚 Vue d'ensemble

Cet atelier est une **présentation progressive et interactive** des concepts clés de la synthèse d'image 3D, structurée en **5 parties** qui explorent :

- 🏗️ L'écosystème **Three.js** et pourquoi les moteurs de rendu existent
- 🎯 La structure et la géométrie 3D en mémoire
- ⚙️ Le pipeline de rendu GPU complet
- 💡 La lumière, les matériaux et le rendu physiquement réaliste
- 🎮 L'interaction 3D et les optimisations de performance

---

## 🚀 Démarrage rapide

### Installation

```bash
# Cloner le repository
git clone <url-du-repo>
cd Diapo-ImagerieNumerique

# Installer les dépendances
npm install
```

### Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez votre navigateur sur `http://localhost:5173` pour accéder aux slides interactifs.

### Compiler pour la production

```bash
npm run build
```

---

## 📖 Structure du cours

### **Partie 1 : L'écosystème Three.js**
Comprendre pourquoi on utilise un moteur de rendu plutôt que de coder directement pour la carte graphique.

- 📌 Introduction : Standard de la 3D Web depuis 2010
- 🔄 Philosophie d'abstraction et gestion automatique du matériel
- 🎭 Anatomie d'une application (Scène, Caméra, Renderer, Objets)
- ⏱️ Le cycle de rendu et synchronisation (60 FPS)

### **Partie 2 : Structure & Géométrie**
Comment la 3D est représentée et organisée en mémoire.

- 📐 Sommets, maillages et normales
- 🌳 Graphe de scène : organisation hiérarchique
- 📸 Systèmes de projection (perspective vs orthographique)

### **Partie 3 : Le Pipeline de Rendu**
Suivre le voyage de la donnée du CPU au pixel affiché.

- 🖥️ Étape préparatoire (CPU) : logique et culling
- 🎪 Placement des points (GPU) : projection
- 🧩 Rastérisation et gestion des pixels
- 🔲 Z-Buffer : gestion de la profondeur

### **Partie 4 : Lumière & Matière**
Apporter du réalisme visuel aux scènes 3D.

- 💫 Types de sources lumineuses (ambiante, directionnelle, ponctuelle)
- ✨ Rendu Physiquement Réaliste (PBR) : Albedo, Rugosité, Métallicité
- 🌟 Introduction au Raytracing et simulation réaliste

### **Partie 5 : Interaction & Optimisation**
Rendre les scènes interactives et performantes.

- 🎯 Interaction 3D : concept du raycasting
- ⚡ Optimisation du détail (LOD) et gestion des performances

---

## 🛠️ Technologies utilisées

| Technologie | Version | Utilisation |
|---|---|---|
| **Three.js** | 0.182.0 | Moteur de rendu 3D WebGL |
| **Vite** | 7.2.4 | Build tool et serveur de développement |
| **Reveal.js** | 5.2.1 | Framework pour les présentations |
| **lil-gui** | 0.21.0 | Contrôles UI pour l'interaction |

---

## 📁 Architecture du projet

```
.
├── index.html              # Point d'entrée principal
├── src/                    # Code source
├── public/                 # Assets statiques
├── package.json            # Configuration npm
├── vite.config.js          # Configuration Vite
└── PLAN.md                 # Plan détaillé du cours
```

---

## 🎯 Objectifs pédagogiques

À la fin de cet atelier, vous comprendrez :

✅ Les principes fondamentaux de la synthèse d'image 3D  
✅ Comment les moteurs de rendu abstraient la complexité GPU  
✅ La structure des données 3D et le graphe de scène  
✅ Le pipeline complet du rendu (CPU → GPU → Pixel)  
✅ L'interaction 3D et les stratégies d'optimisation  

---

## 💡 Points clés

- **Progressive** : Les concepts s'appuient les uns sur les autres
- **Interactive** : Des slides et exemples manipulables en direct
- **Pratique** : Chaque concept est illustré par du code Three.js réel
- **Moderne** : Utilise les standards actuels (ES modules, Vite, WebGL 2.0)

---

## 🔧 Scripts disponibles

- `npm run dev` — Lance le serveur de développement avec hot-reload
- `npm run build` — Génère la version optimisée pour la production
- `npm run preview` — Prévisualise la build de production localement

---

## 📝 Licence

Ce projet est sous licence **MIT**. Voir le fichier `LICENSE` pour plus de détails.

---

## 👨‍💻 Contribuer

Les contributions et améliorations sont bienvenues ! N'hésitez pas à :

1. Forker le projet
2. Créer une branche pour votre feature (`git checkout -b feature/amelioration`)
3. Commiter vos changements (`git commit -m 'Add: nouvelle feature'`)
4. Pousser vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

---

## 📞 Support & Questions

Pour des questions sur le contenu ou des suggestions d'amélioration, n'hésitez pas à ouvrir une issue ou à contacter les mainteneurs.

---

<div align="center">

**Bon apprentissage de la synthèse d'image 3D ! 🚀**

*Créé pour les étudiants en informatique graphique et développeurs Web 3D*

</div>
