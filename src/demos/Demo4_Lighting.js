import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo4_Lighting {
    constructor(renderer) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(0, 0, 5);

        // Objects
        const geometry = new THREE.SphereGeometry(1.5, 64, 32);
        this.material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            flatShading: false,
            shininess: 30
        });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.mesh);

        // Lights
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xffaa00, 1); // Sun-like
        this.dirLight.position.set(5, 5, 5);
        this.scene.add(this.dirLight);

        this.pointLight = new THREE.PointLight(0x00aaff, 1, 10); // Bulb-like
        this.pointLight.position.set(-5, 2, 5);
        this.scene.add(this.pointLight);

        // Helper
        this.dirLightHelper = new THREE.DirectionalLightHelper(this.dirLight, 1);
        this.pointLightHelper = new THREE.PointLightHelper(this.pointLight, 0.5);
        this.scene.add(this.dirLightHelper);
        this.scene.add(this.pointLightHelper);

        // State
        this.params = {
            ambientIntensity: 0.2,
            dirLightEnabled: true,
            dirLightIntensity: 1.0,
            pointLightEnabled: true,
            pointLightIntensity: 1.0,
            materialColor: 0xffffff,
            shininess: 30,
            flatShading: false,
            rotate: true
        };

        // GUI
        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        const folderLights = this.gui.addFolder('Lumières');
        folderLights.add(this.params, 'ambientIntensity', 0, 1).name('Ambiante').onChange(v => this.ambientLight.intensity = v);
        
        folderLights.add(this.params, 'dirLightEnabled').name('Directionnelle (Soleil)').onChange(v => {
            this.dirLight.visible = v;
            this.dirLightHelper.visible = v;
        });
        folderLights.add(this.params, 'dirLightIntensity', 0, 2).name('Intensité Dir.').onChange(v => this.dirLight.intensity = v);

        folderLights.add(this.params, 'pointLightEnabled').name('Ponctuelle (Ampoule)').onChange(v => {
            this.pointLight.visible = v;
            this.pointLightHelper.visible = v;
        });
        folderLights.add(this.params, 'pointLightIntensity', 0, 2).name('Intensité Ponc.').onChange(v => this.pointLight.intensity = v);

        const folderMat = this.gui.addFolder('Matière (Shading)');
        folderMat.addColor(this.params, 'materialColor').name('Couleur').onChange(v => this.material.color.set(v));
        folderMat.add(this.params, 'shininess', 0, 100).name('Brillance (Spéculaire)').onChange(v => this.material.shininess = v);
        folderMat.add(this.params, 'flatShading').name('Flat Shading (Facettes)').onChange(v => {
            this.material.flatShading = v;
            this.material.needsUpdate = true;
        });
        
        this.gui.add(this.params, 'rotate').name('Rotation Auto');
    }

    update() {
        if (this.params.rotate) {
            this.mesh.rotation.y += 0.005;
        }
        // Update helpers if lights move (static here but good practice)
        this.dirLightHelper.update();
        this.pointLightHelper.update();
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
