import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import GUI from 'lil-gui'; 

export class Demo2_Transform {
    constructor(renderer) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        
        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        // Grid
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        this.scene.add(gridHelper);
        
        // Object
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        this.material = new THREE.MeshNormalMaterial({ wireframe: false }); // Normal material helps see rotation
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        // Transform Controls
        // We need the DOM element for event listeners
        this.control = new TransformControls(this.camera, renderer.domElement);
        this.control.attach(this.mesh);
        this.scene.add(this.control);

        // Gizmo event listeners to disable orbit controls if we had them (not yet, but good practice)
        this.control.addEventListener('dragging-changed', (event) => {
            // controls.enabled = !event.value; 
        });

        // GUI
        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        const params = {
            mode: 'translate',
            space: 'world',
            reset: () => {
                this.mesh.position.set(0,0,0);
                this.mesh.rotation.set(0,0,0);
                this.mesh.scale.set(1,1,1);
            }
        };

        this.gui.add(params, 'mode', ['translate', 'rotate', 'scale']).onChange(v => this.control.setMode(v));
        this.gui.add(params, 'space', ['world', 'local']).onChange(v => this.control.setSpace(v));
        this.gui.add(params, 'reset');
    }

    update() {
        // No auto animation, fully interactive
    }

    render(renderer) {
        renderer.render(this.scene, this.camera);
    }

    onResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    dispose() {
        this.control.detach();
        this.control.dispose();
        this.gui.destroy();
        this.geometry.dispose();
        this.material.dispose();
    }
}
