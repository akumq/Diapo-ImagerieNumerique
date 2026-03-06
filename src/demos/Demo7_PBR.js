import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo7_PBR {
    constructor(renderer) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(0, 0, 4);

        // Env Maps / Lighting
        // Standard setup for PBR
        const ambient = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambient);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);
        
        const blueLight = new THREE.PointLight(0x4444ff, 2);
        blueLight.position.set(-5, 0, 2);
        this.scene.add(blueLight);

        const orangeLight = new THREE.PointLight(0xffaa00, 2);
        orangeLight.position.set(5, -2, 2);
        this.scene.add(orangeLight);

        // Procedural Textures
        const textures = this.createProceduralTextures();
        this.maps = {
            none: null,
            albedo: textures.albedo,
            normal: textures.normal,
            roughness: textures.roughness
        };

        // Material
        this.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.7,
            roughness: 0.2,
            map: this.maps.albedo,
            normalMap: this.maps.normal,
            roughnessMap: this.maps.roughness
        });

        // Object
        const geometry = new THREE.SphereGeometry(1.5, 128, 128); // High poly for good lighting
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.mesh);

        // GUI
        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        this.gui.add(this.material, 'metalness', 0, 1).name('Métal (Metalness)');
        this.gui.add(this.material, 'roughness', 0, 1).name('Rugosité (Roughness)');
        this.gui.addColor(this.material, 'color').name('Couleur de Base');

        const folderMaps = this.gui.addFolder('Textures (Maps)');
        
        const params = {
            useAlbedo: true,
            useNormal: true,
            useRoughness: true
        };

        folderMaps.add(params, 'useAlbedo').name('Albedo Map').onChange(v => {
            this.material.map = v ? this.maps.albedo : null;
            this.material.needsUpdate = true;
        });

        folderMaps.add(params, 'useNormal').name('Normal Map').onChange(v => {
            this.material.normalMap = v ? this.maps.normal : null;
            this.material.needsUpdate = true;
        });

        folderMaps.add(params, 'useRoughness').name('Roughness Map').onChange(v => {
            this.material.roughnessMap = v ? this.maps.roughness : null;
            this.material.needsUpdate = true;
        });
    }

    createProceduralTextures() {
        const width = 512, height = 512;
        
        // 1. Albedo (Color Pattern) - Checkerboard
        const canvasAlbedo = document.createElement('canvas');
        canvasAlbedo.width = width; canvasAlbedo.height = height;
        const ctxA = canvasAlbedo.getContext('2d');
        ctxA.fillStyle = '#ffffff';
        ctxA.fillRect(0, 0, width, height);
        ctxA.fillStyle = '#aaaaaa';
        const tiles = 8;
        const tileSize = width / tiles;
        for(let y=0; y<tiles; y++) {
            for(let x=0; x<tiles; x++) {
                if((x+y)%2 === 0) ctxA.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
            }
        }
        const texAlbedo = new THREE.CanvasTexture(canvasAlbedo);

        // 2. Normal Map (Pseudo-relief)
        // We want the checker squares to look slightly raised or have edges.
        // Simple normal map strategy: 
        // Base color (128, 128, 255) = Flat vertical normal.
        // We'll add some "bevel" color gradients to edges.
        const canvasNormal = document.createElement('canvas');
        canvasNormal.width = width; canvasNormal.height = height;
        const ctxN = canvasNormal.getContext('2d');
        ctxN.fillStyle = 'rgb(128, 128, 255)'; // Flat normal
        ctxN.fillRect(0, 0, width, height);
        
        // Draw bevels
        // Simplification: Just draw lines at tile boundaries with different normal colors
        // Left edge of tile = pointing Left (R < 128)
        // Right edge = pointing Right (R > 128)
        // Top edge = pointing Up (G > 128)
        // Bottom edge = pointing Down (G < 128)
        
        const bevel = 4;
        for(let y=0; y<tiles; y++) {
            for(let x=0; x<tiles; x++) {
                const px = x * tileSize;
                const py = y * tileSize;
                
                // We'll just make the "grey" tiles pop out.
                if ((x+y)%2 === 0) {
                   // Top edge (Green > 128)
                   ctxN.fillStyle = 'rgb(128, 200, 255)'; 
                   ctxN.fillRect(px, py, tileSize, bevel);
                   // Bottom edge (Green < 128)
                   ctxN.fillStyle = 'rgb(128, 50, 255)'; 
                   ctxN.fillRect(px, py + tileSize - bevel, tileSize, bevel);
                   // Left edge (Red < 128)
                   ctxN.fillStyle = 'rgb(50, 128, 255)'; 
                   ctxN.fillRect(px, py, bevel, tileSize);
                   // Right edge (Red > 128)
                   ctxN.fillStyle = 'rgb(200, 128, 255)'; 
                   ctxN.fillRect(px + tileSize - bevel, py, bevel, tileSize);
                }
            }
        }
        const texNormal = new THREE.CanvasTexture(canvasNormal);

        // 3. Roughness Map
        // Let's make the white squares smooth (black) and grey squares rough (white)
        const canvasRough = document.createElement('canvas');
        canvasRough.width = width; canvasRough.height = height;
        const ctxR = canvasRough.getContext('2d');
        ctxR.fillStyle = '#111111'; // Smoothish default
        ctxR.fillRect(0, 0, width, height);
        
        for(let y=0; y<tiles; y++) {
            for(let x=0; x<tiles; x++) {
                if((x+y)%2 === 0) {
                    ctxR.fillStyle = '#aaaaaa'; // Rougher
                    ctxR.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
                }
            }
        }
        const texRough = new THREE.CanvasTexture(canvasRough);

        return { albedo: texAlbedo, normal: texNormal, roughness: texRough };
    }

    update() {
        this.mesh.rotation.y += 0.002;
        this.mesh.rotation.x += 0.001;
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
        this.mesh.geometry.dispose();
        this.material.dispose();
        Object.values(this.maps).forEach(t => t?.dispose());
    }
}
