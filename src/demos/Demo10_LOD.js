import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo10_LOD {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(0, 0, 5);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 10, 10);
        this.scene.add(dirLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

        this.lod = new THREE.LOD();

        // Level 0 - High detail
        const geoHigh = new THREE.IcosahedronGeometry(2, 3); 
        const matHigh = new THREE.MeshStandardMaterial({ color: 0x00ff00, wireframe: true, opacity: 1.0, transparent: false });
        const meshHigh = new THREE.Mesh(geoHigh, matHigh);
        this.lod.addLevel(meshHigh, 0);

        // Level 1 - Medium detail
        const geoMed = new THREE.IcosahedronGeometry(2, 1);
        const matMed = new THREE.MeshStandardMaterial({ color: 0x00ff00, wireframe: true, opacity: 1.0, transparent: false });
        const meshMed = new THREE.Mesh(geoMed, matMed);
        this.lod.addLevel(meshMed, 8);

        // Level 2 - Low detail
        const geoLow = new THREE.IcosahedronGeometry(2, 0);
        const matLow = new THREE.MeshStandardMaterial({ color: 0x00ff00, wireframe: true, opacity: 1.0, transparent: false });
        const meshLow = new THREE.Mesh(geoLow, matLow);
        this.lod.addLevel(meshLow, 15);

        this.scene.add(this.lod);

        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        this.params = {
            distance: 5,
            level: "Haute Résolution (Rouge)"
        };

        this.gui.add(this.params, 'distance', 2, 20).name('Distance Caméra').onChange(v => {
            this.camera.position.z = v;
            this.updateLabel();
        });
        
        this.infoController = this.gui.add(this.params, 'level').name('Niveau LOD').disable();
        
        this.updateLabel();
    }

    updateLabel() {
        const dist = this.camera.position.z;
        if (dist < 8) this.params.level = "Haute (Rouge) - 1280 triangles";
        else if (dist < 15) this.params.level = "Moyenne (Jaune) - 80 triangles";
        else this.params.level = "Basse (Verte) - 20 triangles";
        
        this.infoController.updateDisplay();
    }

    update() {
        this.lod.update(this.camera);
        this.lod.rotation.y += 0.005;
    }

    render(renderer) {
        renderer.render(this.scene, this.camera);
    }

    onResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    dispose() {
        this.gui.destroy();
        this.scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
    }
}
