import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui'; 

export class Demo2_Transform {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        
        this.orbit = new OrbitControls(this.camera, renderer.domElement);
        this.orbit.enableDamping = true;

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        const gridHelper = new THREE.GridHelper(10, 10, 0xffffff, 0xaaaaaa);
        this.scene.add(gridHelper);
        this.scene.add(new THREE.AxesHelper(2));
        
        this.geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        this.material = new THREE.MeshNormalMaterial({ transparent: true, opacity: 0.9 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        // Transform Controls
        this.control = new TransformControls(this.camera, renderer.domElement);
        this.control.attach(this.mesh);
        this.scene.add(this.control);

        this.control.addEventListener('dragging-changed', (event) => {
            this.orbit.enabled = !event.value;
        });

        this.overlay = document.createElement('div');
        this.overlay.style.position = 'absolute';
        this.overlay.style.bottom = '20px';
        this.overlay.style.left = '20px';
        this.overlay.style.backgroundColor = 'rgba(51, 51, 51, 0.8)';
        this.overlay.style.color = '#00ff00';
        this.overlay.style.padding = '15px';
        this.overlay.style.fontFamily = 'monospace';
        this.overlay.style.fontSize = '14px';
        this.overlay.style.borderRadius = '8px';
        this.overlay.style.pointerEvents = 'none';
        this.overlay.style.border = '1px solid #333';
        this.overlay.style.boxShadow = '0 0 10px rgba(51, 51, 51, 0.5)';
        this.overlay.innerHTML = 'Chargement de la matrice...';
        document.getElementById('workbench-container').appendChild(this.overlay);

        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        this.params = {
            mode: 'translate',
            space: 'world',
            tx: 0, ty: 0, tz: 0,
            rx: 0, ry: 0, rz: 0,
            reset: () => {
                this.mesh.position.set(0,0,0);
                this.mesh.rotation.set(0,0,0);
                this.mesh.scale.set(1,1,1);
                this.syncParams();
            }
        };

        const modeFolder = this.gui.addFolder('Mode Contrôle');
        modeFolder.add(this.params, 'mode', ['translate', 'rotate', 'scale']).name('Action').onChange(v => {
            this.control.setMode(v);
        });
        modeFolder.add(this.params, 'space', ['world', 'local']).name('Espace').onChange(v => {
            this.control.setSpace(v);
        });
        modeFolder.open();

        const transformFolder = this.gui.addFolder('Valeurs Numériques');
        transformFolder.add(this.params, 'tx', -5, 5).step(0.1).name('Translate X').onChange(v => this.mesh.position.x = v).listen();
        transformFolder.add(this.params, 'ty', -5, 5).step(0.1).name('Translate Y').onChange(v => this.mesh.position.y = v).listen();
        transformFolder.add(this.params, 'tz', -5, 5).step(0.1).name('Translate Z').onChange(v => this.mesh.position.z = v).listen();
        
        transformFolder.add(this.params, 'rx', -Math.PI, Math.PI).step(0.01).name('Rotate X').onChange(v => this.mesh.rotation.x = v).listen();
        transformFolder.add(this.params, 'ry', -Math.PI, Math.PI).step(0.01).name('Rotate Y').onChange(v => this.mesh.rotation.y = v).listen();
        transformFolder.add(this.params, 'rz', -Math.PI, Math.PI).step(0.01).name('Rotate Z').onChange(v => this.mesh.rotation.z = v).listen();
        transformFolder.open();

        this.gui.add(this.params, 'reset').name('Réinitialiser');

        this.control.addEventListener('change', () => {
            this.syncParams();
        });
    }

    syncParams() {
        this.params.tx = this.mesh.position.x;
        this.params.ty = this.mesh.position.y;
        this.params.tz = this.mesh.position.z;
        this.params.rx = this.mesh.rotation.x;
        this.params.ry = this.mesh.rotation.y;
        this.params.rz = this.mesh.rotation.z;
    }

    formatMatrix(matrix) {
        const e = matrix.elements;
        let html = '<div style="margin-bottom: 10px; color: #ffaa00; font-weight: bold;">Matrice de Transformation (4x4)</div>';
        html += '<table style="border-collapse: collapse; text-align: right;">';
        for (let row = 0; row < 4; row++) {
            html += '<tr>';
            for (let col = 0; col < 4; col++) {
                const val = e[col * 4 + row].toFixed(3);
                const isIdentity = (row === col && val === "1.000") || (row !== col && val === "0.000");
                const color = isIdentity ? '#555' : '#00ff00';
                const isTranslation = col === 3 && row < 3;
                const cellColor = isTranslation ? '#ff4444' : color;
                
                html += `<td style="padding: 4px 8px; color: ${cellColor}; border: 1px solid #333;">${val}</td>`;
            }
            html += '</tr>';
        }
        html += '</table>';
        
        html += '<div style="margin-top: 10px; font-size: 11px; color: #888;">';
        html += '<span style="color: #ff4444">Rouge</span> : Translation | <span style="color: #00ff00">Vert</span> : Rotation/Scale';
        html += '</div>';
        
        return html;
    }

    update() {
        if (this.orbit) this.orbit.update();
        this.mesh.updateMatrixWorld();
        this.overlay.innerHTML = this.formatMatrix(this.mesh.matrixWorld);
    }

    render(renderer) {
        renderer.render(this.scene, this.camera);
    }

    onResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    dispose() {
        if (this.gui) this.gui.destroy();
        if (this.overlay) this.overlay.remove();
        if (this.orbit) this.orbit.dispose();
        if (this.control) {
            this.control.detach();
            this.control.dispose();
        }
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
