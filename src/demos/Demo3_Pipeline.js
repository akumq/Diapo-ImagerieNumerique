import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo3_Pipeline {
    constructor(renderer) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(0, 0, 4);
        
        const ambient = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 5, 5);
        this.scene.add(dirLight);

        this.geometry = new THREE.SphereGeometry(1.5, 32, 16); 
        
        // Materials
        this.materials = {
            application: new THREE.MeshBasicMaterial({ 
                color: 0x00ff00, 
                wireframe: true,
                transparent: false,
                opacity: 1.0
            }),
            vertex: new THREE.PointsMaterial({ 
                color: 0x00ff00, 
                size: 0.05,
                sizeAttenuation: true 
            }),
            geometry: new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                wireframe: true,
                transparent: false,
                opacity: 1.0
            }),
            raster: new THREE.MeshBasicMaterial({ 
                color: 0xff0000, 
                wireframe: false
            }),
            lighting: new THREE.MeshStandardMaterial({ 
                color: 0x00aabb, 
                roughness: 0.4,
                metalness: 0.2,
                flatShading: false 
            })
        };

        this.pointsObj = new THREE.Points(this.geometry, this.materials.vertex);
        this.meshObj = new THREE.Mesh(this.geometry, this.materials.raster);
        
        this.currentObject = null;
        
        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        const params = {
            stage: 'intro',
            rotate: true
        };
        this.params = params;

        this.setStage('intro');

        const stages = ['intro', 'application', 'vertex', 'geometry', 'raster', 'fragment', 'screen'];
        this.gui.add(params, 'stage', stages).onChange(v => this.setStage(v));
        this.gui.add(params, 'rotate');
    }

    setStage(stage) {
        if (this.currentObject) {
            this.scene.remove(this.currentObject);
        }
        
        this.params.rotate = false;
        this.scene.background = new THREE.Color(0x333333);

        switch (stage) {
            case 'intro':
                this.currentObject = this.meshObj;
                this.meshObj.material = this.materials.lighting;
                this.params.rotate = true;
                break;
            
            case 'application':
                this.currentObject = this.meshObj;
                this.meshObj.material = this.materials.application;
                this.scene.background = new THREE.Color(0x222222);
                break;

            case 'vertex':
                this.currentObject = this.pointsObj;
                this.scene.background = new THREE.Color(0x2a2a2a);
                break;
            
            case 'geometry':
                this.currentObject = this.meshObj;
                this.meshObj.material = this.materials.geometry;
                this.scene.background = new THREE.Color(0x333333);
                break;

            case 'raster':
                this.currentObject = this.meshObj;
                this.meshObj.material = this.materials.raster;
                this.scene.background = new THREE.Color(0x3a3a3a);
                break;

            case 'fragment':
                this.currentObject = this.meshObj;
                this.meshObj.material = this.materials.lighting;
                this.scene.background = new THREE.Color(0x333333);
                break;

            case 'screen':
                this.currentObject = this.meshObj;
                this.meshObj.material = this.materials.lighting;
                this.scene.background = new THREE.Color(0x555555);
                break;
        }

        if (stage === 'application') {
            this.createTableOverlay();
        } else {
            this.removeTableOverlay();
        }

        if (this.currentObject) {
            this.scene.add(this.currentObject);
        }
        
        if (this.params.stage !== stage) {
            this.params.stage = stage;
            this.gui.controllers.find(c => c.property === 'stage')?.updateDisplay();
        }
        this.gui.controllers.find(c => c.property === 'rotate')?.updateDisplay();
    }

    createTableOverlay() {
        if (document.getElementById('vertex-data-table')) return;

        const table = document.createElement('div');
        table.id = 'vertex-data-table';
        table.style.position = 'absolute';
        table.style.top = '50%';
        table.style.left = '50%';
        table.style.transform = 'translate(-50%, -50%)';
        table.style.backgroundColor = 'rgba(51, 51, 51, 0.9)';
        table.style.color = '#00ff00';
        table.style.fontFamily = 'monospace';
        table.style.padding = '20px';
        table.style.borderRadius = '8px';
        table.style.border = '1px solid #333';
        table.style.zIndex = '100';
        table.style.maxHeight = '80vh';
        table.style.overflowY = 'auto';

        let html = '<h3 style="margin-top:0; border-bottom:1px solid #444; padding-bottom:10px;">Vertex Data</h3>';
        html += '<table style="width:100%; border-collapse: collapse; text-align: right;">';
        html += '<tr style="color: #888;"><th>IDX</th><th>X</th><th>Y</th><th>Z</th></tr>';

        const posAttr = this.geometry.attributes.position;
        for (let i = 0; i < 15; i++) {
            const x = posAttr.getX(i).toFixed(4);
            const y = posAttr.getY(i).toFixed(4);
            const z = posAttr.getZ(i).toFixed(4);
            html += `<tr>
                <td style="color:#666; padding-right:15px;">[${i}]</td>
                <td style="padding: 2px 10px;">${x}</td>
                <td style="padding: 2px 10px;">${y}</td>
                <td style="padding: 2px 10px;">${z}</td>
            </tr>`;
        }
        html += '<tr><td colspan="4" style="text-align:center; color:#666;">...</td></tr>';
        html += '</table>';

        table.innerHTML = html;
        document.getElementById('workbench-container').appendChild(table);
    }

    removeTableOverlay() {
        const table = document.getElementById('vertex-data-table');
        if (table) {
            table.remove();
        }
    }

    update() {
        if (this.params.rotate && this.currentObject) {
            this.currentObject.rotation.y += 0.005;
        }
    }

    render(renderer) {
        renderer.render(this.scene, this.camera);
    }

    onResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    dispose() {
        this.removeTableOverlay();
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
