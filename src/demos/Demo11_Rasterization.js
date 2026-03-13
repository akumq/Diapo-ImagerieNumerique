import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo11_Rasterization {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(0, 0, 5);

        // 1. The "Vector" Triangle (Mathematical smooth shape)
        const triGeom = new THREE.BufferGeometry();
        this.triVertices = new Float32Array([
            -1.5, -1.0, 0.1,
             1.5, -0.5, 0.1,
             0.0,  1.5, 0.1
        ]);
        triGeom.setAttribute('position', new THREE.BufferAttribute(this.triVertices, 3));
        
        this.vectorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00, 
            wireframe: true, 
            transparent: true, 
            opacity: 1.0 
        });
        this.vectorTriangle = new THREE.Mesh(triGeom, this.vectorMaterial);
        this.scene.add(this.vectorTriangle);

        // 2. The Pixel Grid (Rasterized representation)
        this.pixelGroup = new THREE.Group();
        this.scene.add(this.pixelGroup);
        
        this.params = {
            resolution: 20,
            showVector: true,
            showRaster: true,
            animate: true,
            opacity: 0.5
        };

        this.pixels = [];
        this.createGrid();

        // GUI
        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        this.gui.add(this.params, 'resolution', 5, 50, 1).name('Résolution (Pixels)').onChange(() => this.createGrid());
        this.gui.add(this.params, 'showVector').name('Afficher Vecteur');
        this.gui.add(this.params, 'showRaster').name('Afficher Rastérisé');
        this.gui.add(this.params, 'opacity', 0, 1).name('Opacité Grille').onChange(v => {
            this.pixels.forEach(p => p.material.opacity = v);
        });
        this.gui.add(this.params, 'animate').name('Animer Triangle');
    }

    createGrid() {
        // Clear old pixels
        while(this.pixelGroup.children.length > 0) {
            const child = this.pixelGroup.children[0];
            child.geometry.dispose();
            child.material.dispose();
            this.pixelGroup.remove(child);
        }
        this.pixels = [];

        const res = this.params.resolution;
        const size = 4; // Area size
        const step = size / res;
        const half = size / 2;

        const pixelGeo = new THREE.PlaneGeometry(step * 0.9, step * 0.9);

        for (let y = 0; y < res; y++) {
            for (let x = 0; x < res; x++) {
                const mat = new THREE.MeshBasicMaterial({ 
                    color: 0x333333, 
                    transparent: true, 
                    opacity: this.params.opacity 
                });
                const pixel = new THREE.Mesh(pixelGeo, mat);
                pixel.position.set(
                    (x * step) - half + (step / 2),
                    (y * step) - half + (step / 2),
                    0
                );
                this.pixelGroup.add(pixel);
                this.pixels.push(pixel);
            }
        }
    }

    // Barycentric technique to check if point is in triangle
    isPointInTriangle(p, a, b, c) {
        const v0 = [c[0] - a[0], c[1] - a[1]];
        const v1 = [b[0] - a[0], b[1] - a[1]];
        const v2 = [p.x - a[0], p.y - a[1]];

        const dot00 = v0[0] * v0[0] + v0[1] * v0[1];
        const dot01 = v0[0] * v1[0] + v0[1] * v1[1];
        const dot02 = v0[0] * v2[0] + v0[1] * v2[1];
        const dot11 = v1[0] * v1[0] + v1[1] * v1[1];
        const dot12 = v1[0] * v2[0] + v1[1] * v2[1];

        const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return (u >= 0) && (v >= 0) && (u + v < 1);
    }

    update() {
        const time = Date.now() * 0.001;
        
        if (this.params.animate) {
            // Move triangle vertices slightly
            const attr = this.vectorTriangle.geometry.attributes.position;
            attr.array[0] = -1.5 + Math.sin(time) * 0.5;
            attr.array[4] = -0.5 + Math.cos(time * 0.8) * 0.5;
            attr.array[7] = 1.5 + Math.sin(time * 1.2) * 0.3;
            attr.needsUpdate = true;
        }

        const a = [this.triVertices[0], this.triVertices[1]];
        const b = [this.triVertices[3], this.triVertices[4]];
        const c = [this.triVertices[6], this.triVertices[7]];

        this.vectorTriangle.visible = this.params.showVector;
        this.pixelGroup.visible = this.params.showRaster;

        // Update each pixel's color based on coverage
        this.pixels.forEach(p => {
            const inside = this.isPointInTriangle(p.position, a, b, c);
            if (inside) {
                p.material.color.set(0x00ff00);
                p.material.opacity = this.params.opacity;
            } else {
                p.material.color.set(0x333333);
                p.material.opacity = this.params.opacity * 0.5;
            }
        });
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
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
            }
        });
    }
}
