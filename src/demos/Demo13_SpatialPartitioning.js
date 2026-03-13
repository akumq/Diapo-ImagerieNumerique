import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo13_SpatialPartitioning {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(0, 15, 15);
        this.camera.lookAt(0, 0, 0);

        // --- Nodes Visualization ---
        this.createNodeGrids();

        // --- Shared Object (The "Entity") ---
        const geom = new THREE.SphereGeometry(0.8, 32, 32);
        this.entity = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x00ff88 }));
        this.scene.add(this.entity);

        // --- Ghost Replicas (for visual feedback) ---
        this.ghosts = [];
        for(let i=0; i<3; i++) {
            const ghost = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, transparent: true, opacity: 0.3 }));
            ghost.visible = false;
            this.scene.add(ghost);
            this.ghosts.push(ghost);
        }

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const pLight = new THREE.PointLight(0xffffff, 50);
        pLight.position.set(0, 10, 0);
        this.scene.add(pLight);

        // --- State ---
        this.params = {
            replicationDistance: 2.0,
            showBoundaries: true,
            info: 'Node Actif : Aucun'
        };

        this.gui = new GUI({ container: document.getElementById('workbench-container') });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        this.gui.add(this.params, 'replicationDistance', 0.5, 5.0).name('Zone de Réplication');
        this.gui.add(this.params, 'showBoundaries').name('Afficher Frontières');
        this.infoCtrl = this.gui.add(this.params, 'info').name('Statut').disable();

        this.time = 0;
    }

    createNodeGrids() {
        const size = 10;
        const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44];
        const positions = [
            [-size/2, -size/2], [size/2, -size/2],
            [-size/2, size/2], [size/2, size/2]
        ];

        this.nodeHelpers = [];
        positions.forEach((pos, i) => {
            const grid = new THREE.GridHelper(size, 10, colors[i], 0x222222);
            grid.position.set(pos[0], 0, pos[1]);
            this.scene.add(grid);
            this.nodeHelpers.push(grid);
        });
    }

    update() {
        this.time += 0.01;
        
        // Circular motion across nodes
        const x = Math.sin(this.time) * 8;
        const z = Math.cos(this.time) * 8;
        this.entity.position.set(x, 0.8, z);

        // Identify current Master Node
        let masterNode = -1;
        if (x < 0 && z < 0) masterNode = 0;
        else if (x >= 0 && z < 0) masterNode = 1;
        else if (x < 0 && z >= 0) masterNode = 2;
        else masterNode = 3;

        this.params.info = `Master : Nœud ${masterNode + 1}`;
        this.infoCtrl.updateDisplay();

        // Highlight active node
        this.nodeHelpers.forEach((h, i) => {
            h.material.opacity = (i === masterNode) ? 1.0 : 0.2;
            h.material.transparent = true;
        });

        // --- Replication Logic ---
        // If entity is close to a boundary, show a ghost in the neighbor node
        this.ghosts.forEach(g => g.visible = false);
        let ghostIdx = 0;

        const distToX = Math.abs(x);
        const distToZ = Math.abs(z);

        if (distToX < this.params.replicationDistance) {
            this.showGhost(x, z, ghostIdx++, true, false);
        }
        if (distToZ < this.params.replicationDistance) {
            this.showGhost(x, z, ghostIdx++, false, true);
        }
    }

    showGhost(x, z, idx, flipX, flipZ) {
        if (idx >= this.ghosts.length) return;
        const g = this.ghosts[idx];
        g.visible = true;
        g.position.set(x, 0.8, z);
        // On simule une légère latence sur le fantôme (concept distribué)
        g.position.x += flipX ? (x > 0 ? -0.1 : 0.1) : 0;
        g.position.z += flipZ ? (z > 0 ? -0.1 : 0.1) : 0;
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
    }
}
