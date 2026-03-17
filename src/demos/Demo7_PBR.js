import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo7_PBR {
    constructor(renderer) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);
        
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');

        // Space background (used for reflections)
        loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/galaxy_starfield.png', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            this.scene.environment = texture;
        });

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(0, 0, 6);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.7); 
        this.scene.add(ambient);

        const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
        sunLight.position.set(5, 5, 10);
        this.scene.add(sunLight);

        this.pointLights = [];
        const lightConfigs = [
            { col: 0xffffff, pos: [10, 10, 10], int: 500 }, 
            { col: 0x4444ff, pos: [-10, 0, 5], int: 300 },  
            { col: 0xffaa00, pos: [10, -5, 5], int: 300 }   
        ];

        lightConfigs.forEach(cfg => {
            const l = new THREE.PointLight(cfg.col, cfg.int);
            l.position.set(...cfg.pos);
            this.scene.add(l);
            this.pointLights.push(l);
        });

        const earthAlbedo = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';
        const earthNormal = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg';

        const proceduralMaps = this.createProceduralTextures();

        this.maps = {
            albedo: loader.load(earthAlbedo, (t) => { t.needsUpdate = true; }),
            normal: loader.load(earthNormal, (t) => { t.needsUpdate = true; }),
            roughness: loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'),
            uvGrid: proceduralMaps.uvGrid
        };

        this.pbrMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.0,
            roughness: 0.9,
            map: this.maps.albedo,
            normalMap: this.maps.normal,
            roughnessMap: this.maps.roughness
        });
        this.pbrMaterial.normalScale.set(1.5, 1.5);

        this.debugMaterial = new THREE.MeshBasicMaterial({ map: this.maps.albedo });

        this.geometry = new THREE.SphereGeometry(1.5, 64, 32);
        this.mesh = new THREE.Mesh(this.geometry, this.pbrMaterial);
        this.scene.add(this.mesh);

        // Texture preview plane
        this.planeGeometry = new THREE.PlaneGeometry(2, 2);
        this.planeMaterial = new THREE.MeshBasicMaterial({ map: this.maps.albedo, side: THREE.DoubleSide });
        this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
        this.planeMesh.position.y = -2.5;
        this.planeMesh.visible = false;
        this.scene.add(this.planeMesh);

        // UV wireframe
        this.uvWire = new THREE.LineSegments(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.4 })
        );
        this.planeMesh.add(this.uvWire);
        this.uvWire.position.z = 0.01;

        this.updateUVProjection();

        this.params = {
            viewMode: 'PBR Complet',
            geometry: 'Sphère',
            repeatX: 1,
            repeatY: 1,
            offsetX: 0,
            offsetY: 0,
            showPlane: false,
            showUV: true,
            rotate: true
        };

        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        this.gui.add(this.params, 'viewMode', [
            'PBR Complet', 
            'Albedo (Couleur)', 
            'Normal Map (Relief)', 
            'Roughness (Rugosité)', 
            'Grille UV (Mapping)'
        ]).name('Mode de Vue').onChange(v => this.updateViewMode(v));

        this.gui.add(this.params, 'geometry', ['Sphère', 'Tore']).name('Objet').onChange(v => this.updateGeometry(v));

        this.gui.add(this.params, 'showPlane').name('Afficher Texture 2D').onChange(v => {
            this.planeMesh.visible = v;
            this.camera.position.z = v ? 4 : 6;
            this.camera.position.y = v ? -1.0 : 0;
            this.camera.lookAt(0, v ? -1.2 : 0, 0);
            this.updateUVProjection();
        });

        this.gui.add(this.params, 'showUV').name('Projeter Vertices (UV)').onChange(v => {
            this.uvWire.visible = v;
        });

        const folderUV = this.gui.addFolder('Manipulation UV (Mapping)');
        folderUV.add(this.params, 'repeatX', 0.1, 5).name('Répétition U (Tile)').onChange(() => this.updateUVs());
        folderUV.add(this.params, 'repeatY', 0.1, 5).name('Répétition V (Tile)').onChange(() => this.updateUVs());
        folderUV.add(this.params, 'offsetX', 0, 1).name('Décalage U (Offset)').onChange(() => this.updateUVs());
        folderUV.add(this.params, 'offsetY', 0, 1).name('Décalage V (Offset)').onChange(() => this.updateUVs());
        folderUV.open();

        this.gui.add(this.params, 'rotate').name('Rotation Auto');
    }

    createProceduralTextures() {
        const width = 512, height = 512;
        
        const createCanvas = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            return { canvas, ctx: canvas.getContext('2d') };
        };

        // UV Grid
        const { canvas: cU, ctx: ctxU } = createCanvas();
        ctxU.fillStyle = '#222'; ctxU.fillRect(0,0,width,height);
        ctxU.strokeStyle = '#00ff00'; ctxU.lineWidth = 2;
        const steps = 8;
        const stepSize = width / steps;
        for(let i=0; i<=steps; i++) {
            ctxU.beginPath(); ctxU.moveTo(i*stepSize, 0); ctxU.lineTo(i*stepSize, height); ctxU.stroke();
            ctxU.beginPath(); ctxU.moveTo(0, i*stepSize); ctxU.lineTo(width, i*stepSize); ctxU.stroke();
            for(let j=0; j<steps; j++) {
                ctxU.fillStyle = '#0f0'; ctxU.font = '16px Arial';
                ctxU.fillText(`U:${(i/steps).toFixed(1)}`, i*stepSize + 5, j*stepSize + 20);
                ctxU.fillText(`V:${(1-j/steps).toFixed(1)}`, i*stepSize + 5, j*stepSize + 40);
            }
        }
        const texUV = new THREE.CanvasTexture(cU);

        return { uvGrid: texUV };
    }

    updateViewMode(mode) {
        const isPBR = mode === 'PBR Complet';
        this.pointLights.forEach(l => l.visible = isPBR);

        if (isPBR) {
            this.mesh.material = this.pbrMaterial;
            this.planeMaterial.map = this.maps.albedo;
        } else {
            this.mesh.material = this.debugMaterial;
            switch(mode) {
                case 'Albedo (Couleur)': this.debugMaterial.map = this.maps.albedo; break;
                case 'Normal Map (Relief)': this.debugMaterial.map = this.maps.normal; break;
                case 'Roughness (Rugosité)': this.debugMaterial.map = this.maps.roughness; break;
                case 'Grille UV (Mapping)': this.debugMaterial.map = this.maps.uvGrid; break;
            }
            this.planeMaterial.map = this.debugMaterial.map;
        }
        this.mesh.material.needsUpdate = true;
        this.planeMaterial.needsUpdate = true;
    }

    updateGeometry(type) {
        this.geometry.dispose();
        if (type === 'Sphère') this.geometry = new THREE.SphereGeometry(1.5, 64, 32);
        else if (type === 'Tore') this.geometry = new THREE.TorusGeometry(1, 0.4, 32, 100);
        this.mesh.geometry = this.geometry;
        this.updateUVProjection();
    }

    updateUVProjection() {
        if (!this.geometry) return;
        const uvAttr = this.geometry.attributes.uv;
        const indexAttr = this.geometry.index;
        if (!uvAttr) return;

        const points = [];
        
        const getPoint = (idx) => {
            const u = uvAttr.getX(idx);
            const v = uvAttr.getY(idx);
            return new THREE.Vector3(u * 2 - 1, v * 2 - 1, 0);
        };

        if (indexAttr) {
            for (let i = 0; i < indexAttr.count; i += 3) {
                const a = indexAttr.getX(i);
                const b = indexAttr.getX(i + 1);
                const c = indexAttr.getX(i + 2);
                const pA = getPoint(a); const pB = getPoint(b); const pC = getPoint(c);
                points.push(pA, pB, pB, pC, pC, pA);
            }
        } else {
            for (let i = 0; i < uvAttr.count; i += 3) {
                const pA = getPoint(i); const pB = getPoint(i + 1); const pC = getPoint(i + 2);
                points.push(pA, pB, pB, pC, pC, pA);
            }
        }

        this.uvWire.geometry.dispose();
        this.uvWire.geometry = new THREE.BufferGeometry().setFromPoints(points);
    }

    updateUVs() {
        const maps = Object.values(this.maps);
        maps.forEach(map => {
            map.repeat.set(this.params.repeatX, this.params.repeatY);
            map.offset.set(this.params.offsetX, this.params.offsetY);
        });
    }

    update() {
        if (this.params.rotate) {
            this.mesh.rotation.y += 0.005;
            this.mesh.rotation.x += 0.002;
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
        this.gui.destroy();
        Object.values(this.maps).forEach(t => t.dispose());
        this.scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
            }
        });
    }
}
