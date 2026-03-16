### Q1. Les 4 piliers Three.js ?

A) Scene, Camera, Renderer, Objects  
B) HTML, CSS, JS, Canvas  
C) Texture, UV, HDR, PNG  
D) CPU, GPU, RAM, VRAM

### Q3. Un `Mesh`, c’est…

A) Géométrie + Matériau  
B) Caméra + Lumière  
C) Scène + Renderer  
D) Texture + Shader

### Q5. Une normale sert à…

A) Placer la caméra  
B) Calculer l’éclairage  
C) Compresser une texture  
D) Changer le FOV

### Q8. Le vertex shader s’exécute…

A) Par objet  
B) Par sommet  
C) Par pixel  
D) Par texture

### Q9. Le fragment shader s’exécute…

A) Par pixel / fragment  
B) Par sommet  
C) Par scène  
D) Par draw call

### Q10. La rastérisation fait…

A) Pixels → triangles  
B) Triangles → fragments  
C) GLSL → JS  
D) VRAM → RAM

### Q12. Lumière ambiante :

A) Uniforme, sans direction  
B) Direction unique (soleil)  
C) Point avec distance  
D) N’éclaire que les métaux

### Q15. Graphe de scène : un enfant…

A) Ignore le parent  
B) Hérite des transformations du parent  
C) Hérite seulement des textures  
D) Hérite seulement de la caméra

### Q17. “Draw calls” : le coût principal vient…

A) Du calcul pixel sur CPU  
B) De la communication CPU → GPU (overhead)  
C) Du manque de textures  
D) Du Z-buffer trop grand

### Q18. Clipping :

A) Coupe hors frustum  
B) Mélange les couleurs  
C) Compresse les VBO  
D) Crée les normales

### Q24. Après édition d’un `BufferAttribute`, il faut…

A) `attribute.needsUpdate = true`  
B) `renderer.clearColor()`  
C) `scene.dispose()`  
D) `camera.reset()`

### Q25. Z-fighting :

A) Deux surfaces très proches en profondeur  
B) Trop de lumières ambiantes  
C) Trop d’UV  
D) Un FOV trop petit

---

## Explications (corrigé commenté)

**Q1 — ✅ A.** Scene/Camera/Renderer/Objects sont les briques de base d’une appli Three.js.
Les autres propositions sont des techno ou ressources, pas la structure logique du moteur.

**Q3 — ✅ A.** Un `Mesh` associe une **géométrie** (forme) et un **matériau** (apparence).
C’est l’objet “rendu” typique dans la scène.

**Q5 — ✅ B.** La normale indique l’orientation locale de la surface.
Elle est essentielle pour l’éclairage (ex. Lambert : `N · L`).

**Q8 — ✅ B.** Le vertex shader traite les données **par sommet** (positions, normales, etc.).
Il prépare notamment la projection et les valeurs à interpoler.

**Q9 — ✅ A.** Le fragment shader s’exécute **par fragment/pixel** candidat.
Il calcule la couleur finale (textures, lumière, etc.).

**Q10 — ✅ B.** La rastérisation convertit des triangles en **fragments** sur une grille de pixels.
C’est le passage “géométrie → pixels”.

**Q12 — ✅ A.** La lumière ambiante ajoute une illumination constante, sans direction.
Elle simule un fond lumineux minimal (pas d’ombres directionnelles).

**Q15 — ✅ B.** Dans un graphe de scène, un enfant hérite des transformations du parent.
Son transform monde dépend de la hiérarchie (parentalité).

**Q17 — ✅ B.** Les draw calls ont un coût d’overhead (CPU/driver → GPU).
Beaucoup de petits objets peuvent saturer le CPU avant même le GPU.

**Q18 — ✅ A.** Le clipping élimine/rogne les primitives hors du volume de vision (frustum).
Ça évite de rastériser ce qui ne peut pas apparaître à l’écran.

**Q24 — ✅ A.** Modifier un `BufferAttribute` nécessite `needsUpdate = true`.
Sinon, le GPU peut continuer à utiliser l’ancien buffer.

**Q25 — ✅ A.** Le Z-fighting arrive quand deux surfaces ont des profondeurs très proches.
Le depth buffer n’arrive plus à trancher proprement (précision limitée).

---

## Illustrations (liens)

Q1 : https://raw.githubusercontent.com/mrdoob/three.js/dev/files/icon.svg

Q3 : https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Dolphin_triangle_mesh.png/500px-Dolphin_triangle_mesh.png

Q5 : https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg

Q8 : https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Geometry_pipeline_en.svg/960px-Geometry_pipeline_en.svg.png

Q9 : https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Graphics_pipeline_2_en.svg/960px-Graphics_pipeline_2_en.svg.png

Q10 : https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Raster_graphic_fish_20x23squares_sdtv-example.png/1280px-Raster_graphic_fish_20x23squares_sdtv-example.png

Q12 : https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Phong_components_version_4.png/500px-Phong_components_version_4.png

Q15 : https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Architecture_of_OpenSceneGraph.jpg/500px-Architecture_of_OpenSceneGraph.jpg

Q17 : https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Generic_block_diagram_of_a_GPU.svg/1280px-Generic_block_diagram_of_a_GPU.svg.png

Q18 : https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Cube_clipping.svg/500px-Cube_clipping.svg.png

Q24 : https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/View_transform.svg/960px-View_transform.svg.png

Q25 : https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/ZfightingCB.png/500px-ZfightingCB.png

