# Plan du Cours : Synthèse d'Image 3D
## Architecture, Concepts et Pipeline de Rendu

Ce plan suit une progression logique allant de l'outil (Three.js) à la structure des données, pour finir sur le processus de fabrication de l'image (Pipeline).

---

### PARTIE 1 : L'écosystème Three.js
*Objectif : Comprendre pourquoi on utilise un moteur de rendu plutôt que de coder directement pour la carte graphique.*

**[Note] L'objectif est de faire en sorte de présenter Threejs et les raison pour laquelle ça existe**

* **1.0 Introduction** : Standard de la 3D Web depuis 2010.
* **1.1 Philosophie d'Abstraction** : Simplifier la complexité, gestion automatique du matériel, approche orientée "Objets".



* **1.2 Anatomie d'une Application** :
    * **Scène** : Le plateau de tournage.
    * **Caméra** : Le point de vue.
    * **Renderer** : Le moteur de dessin.
    * **Objets** : Forme (Géométrie) + Apparence (Matériau).
* **1.3 Le Cycle de Rendu (Loop)** : Synchronisation avec le rafraîchissement écran (60 FPS) et mise à jour des états.

---

### PARTIE 2 : Structure & Géométrie
*Objectif : Comprendre comment la 3D est représentée en mémoire.*

* **2.1 Structure des Objets 3D** :
    * **Sommets** : Les points de repère.
    * **Maillage** : La surface formée par les triangles.
    * **Normale** : L'orientation des faces pour la lumière.
* **2.2 Le Graphe de Scène** : Organisation hiérarchique (Parents/Enfants) et propagation des mouvements.
* **2.3 Point de vue (Caméra)** : Perspective (profondeur réelle) vs Orthographique (vue technique).

---

### PARTIE 3 : Le Pipeline de Rendu
*Objectif : Suivre le voyage de la donnée, du clic de souris au pixel affiché.*

* **3.1 Étape Préparatoire (CPU)** : Logique, physique, et tri des objets visibles (Culling).
* **3.2 Placement des Points (GPU)** : Projection simultanée de tous les points sur la surface de l'écran.
* **3.3 Rastérisation & Pixels** : 
    * Conversion des triangles en grille de pixels.
    * **Coloration** : Application des couleurs et textures.
    * **Z-Buffer** : Gestion de la superposition (qui est devant qui).

---

### PARTIE 4 : Lumière & Matière
*Objectif : Apporter du réalisme visuel.*

* **4.1 Sources de Lumière** : Ambiante (partout), Directionnelle (soleil), Ponctuelle (ampoule).
* **4.2 Rendu Physiquement Réaliste (PBR)** :
    * **Albedo** : Couleur de base.
    * **Rugosité** : Mate vs Brillante.
    * **Métallicité** : Reflets métalliques.
* **4.3 Raytracing** : Simulation réelle des rayons lumineux (ombres et reflets parfaits).

---

### PARTIE 5 : Interaction & Optimisation
*Objectif : Rendre la scène interactive et fluide.*

* **5.1 Interaction (Le Clic 3D)** : Concept du lancer de rayon (Raycasting) pour sélectionner un objet.
* **5.2 Optimisation du détail (LOD)** : Adapter la complexité du maillage selon la distance de l'objet pour préserver les performances.
