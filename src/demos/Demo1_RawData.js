import * as THREE from 'three';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui'; 

export class Demo1_RawData {
    constructor(renderer) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);        this.camera.position.set(3, 3, 5);
        this.camera.lookAt(0, 0, 0);
        
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.controls.enableDamping = true;
        
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        this.scene.add(new THREE.GridHelper(10, 10, 0xffffff, 0xaaaaaa));
        this.scene.add(new THREE.AxesHelper(2));

        this.geometry = new THREE.IcosahedronGeometry(1.5, 0);
        this.material = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            wireframe: true,
            flatShading: true,
            roughness: 0.5,
            metalness: 0.1,
            opacity: 1.0,
            transparent: false
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        this.normalsHelper = new VertexNormalsHelper(this.mesh, 0.5, 0x00ff00);
        this.normalsHelper.visible = false;
        this.scene.add(this.normalsHelper);

        const vGeo = new THREE.SphereGeometry(0.1, 16, 16);
        const vMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.vertexHighlighter = new THREE.Mesh(vGeo, vMat);
        this.vertexHighlighter.visible = false;
        this.mesh.add(this.vertexHighlighter);

        const fGeo = new THREE.BufferGeometry();
        fGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
        const fMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide, opacity: 1.0, transparent: false });
        this.faceHighlighter = new THREE.Mesh(fGeo, fMat);
        this.faceHighlighter.visible = false;
        this.faceHighlighter.scale.multiplyScalar(1.02); 
        this.mesh.add(this.faceHighlighter);

        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        const params = {
            wireframe: true,
            showNormals: false,
            highlightVertex: true,
            highlightFace: true,
            vertexIndex: 0,
            autoRotate: true
        };
        this.params = params;

        this.gui.add(params, 'wireframe').onChange(v => this.material.wireframe = v);
        this.gui.add(params, 'showNormals').name('Afficher Normales').onChange(v => this.normalsHelper.visible = v);
        
        const folderCull = this.gui.addFolder('Rendu & Culling');
        this.params.culling = true;
        this.params.shape = 'Icosahedron';
        
        folderCull.add(this.params, 'culling').name('Backface Culling').onChange(v => {
            this.material.side = v ? THREE.FrontSide : THREE.DoubleSide;
            this.material.needsUpdate = true;
        });

        folderCull.add(this.params, 'shape', ['Icosahedron', 'Plane']).name('Forme').onChange(v => this.updateGeometry(v));
        folderCull.open();

        const folderGeo = this.gui.addFolder('Inspection');
        folderGeo.add(params, 'highlightVertex').name('Highlight Vertex').onChange(() => this.updateHighlights());
        folderGeo.add(params, 'highlightFace').name('Highlight Face (Triangle)').onChange(() => this.updateHighlights());
        folderGeo.add(params, 'vertexIndex', 0, 11, 1).name('Index Selector').step(1).onChange(() => this.updateHighlights()); 
        folderGeo.open();

        this.gui.add(params, 'autoRotate').name('Auto Rotate');

        this.mesh.updateMatrixWorld();
        this.updateHighlights();
    }

    updateGeometry(type) {
        this.geometry.dispose();
        this.normalsHelper.geometry.dispose();

        if (type === 'Plane') {
            this.geometry = new THREE.PlaneGeometry(3, 3, 2, 2);
        } else {
            this.geometry = new THREE.IcosahedronGeometry(1.5, 0);
        }

        this.mesh.geometry = this.geometry;
        
        this.scene.remove(this.normalsHelper);
        this.normalsHelper = new VertexNormalsHelper(this.mesh, 0.5, 0x00ff00);
        this.normalsHelper.visible = this.params.showNormals;
        this.scene.add(this.normalsHelper);

        this.updateHighlights();
    }

    updateHighlights() {
        if (!this.geometry) return;
        const posAttribute = this.geometry.getAttribute('position');
        if (!posAttribute) return;
        
        this.vertexHighlighter.visible = this.params.highlightVertex;
        if (this.params.highlightVertex) {
            const vIndex = this.params.vertexIndex % posAttribute.count;
            const x = posAttribute.getX(vIndex);
            const y = posAttribute.getY(vIndex);
            const z = posAttribute.getZ(vIndex);
            this.vertexHighlighter.position.set(x, y, z);
        }

        this.faceHighlighter.visible = this.params.highlightFace;
        if (this.params.highlightFace) {
            const indexAttribute = this.geometry.index;
            let a, b, c;

            if (indexAttribute) {
                 const totalFaces = indexAttribute.count / 3;
                 const faceIndex = this.params.vertexIndex % totalFaces;
                 a = indexAttribute.getX(faceIndex * 3);
                 b = indexAttribute.getX(faceIndex * 3 + 1);
                 c = indexAttribute.getX(faceIndex * 3 + 2);
            } else {
                 const totalFaces = posAttribute.count / 3;
                 const faceIndex = this.params.vertexIndex % totalFaces;
                 a = faceIndex * 3;
                 b = faceIndex * 3 + 1;
                 c = faceIndex * 3 + 2;
            }

            const pA = new THREE.Vector3().fromBufferAttribute(posAttribute, a);
            const pB = new THREE.Vector3().fromBufferAttribute(posAttribute, b);
            const pC = new THREE.Vector3().fromBufferAttribute(posAttribute, c);

            const positions = this.faceHighlighter.geometry.attributes.position.array;
            pA.toArray(positions, 0);
            pB.toArray(positions, 3);
            pC.toArray(positions, 6);
            this.faceHighlighter.geometry.attributes.position.needsUpdate = true;
        }
    }

    update() {
        if (this.controls) this.controls.update();
        if (this.normalsHelper) this.normalsHelper.update();
        
        if (this.params.autoRotate) {
             this.mesh.rotation.y += 0.005;
             this.mesh.rotation.x += 0.002;
        }
        
        if (this.params.highlightVertex || this.params.highlightFace) {
             this.updateHighlights(); 
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
        if (this.controls) this.controls.dispose();
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
