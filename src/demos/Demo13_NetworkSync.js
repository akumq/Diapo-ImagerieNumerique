import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo13_NetworkSync {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // --- Scene Elements ---
        this.scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222));
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const sun = new THREE.PointLight(0xffffff, 20);
        sun.position.set(5, 10, 5);
        this.scene.add(sun);

        // 1. Server Object (The "Truth" - Ghost)
        this.serverGhost = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true, opacity: 0.5 })
        );
        this.scene.add(this.serverGhost);

        // 2. Client Object (What the player sees)
        this.clientPlayer = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x00ff88 })
        );
        this.scene.add(this.clientPlayer);

        // --- State ---
        this.params = {
            latency: 200, // ms
            prediction: true,
            reconciliation: true,
            jitter: 0,
            info: 'Mode : Prédiction Active'
        };

        this.serverPosition = new THREE.Vector3(0, 0.5, 0);
        this.clientPosition = new THREE.Vector3(0, 0.5, 0);
        this.inputQueue = [];
        this.time = 0;

        // --- GUI ---
        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        this.gui.add(this.params, 'latency', 0, 1000).name('Latence (Ping ms)');
        this.gui.add(this.params, 'prediction').name('Client Prediction').onChange(v => this.updateInfo());
        this.gui.add(this.params, 'reconciliation').name('Server Recon.').onChange(v => this.updateInfo());
        this.infoCtrl = this.gui.add(this.params, 'info').name('Statut').disable();

        // Mouse interaction to move
        this.targetPos = new THREE.Vector3(0, 0.5, 0);
        this.onPointerDown = (e) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const z = ((e.clientY - rect.top) / rect.height) * 2 - 1;
            this.targetPos.set(x * 8, 0.5, z * 8);
        };
        window.addEventListener('pointerdown', this.onPointerDown);
    }

    updateInfo() {
        if (!this.params.prediction) this.params.info = "Mouvement 'Laggy' (Attente Serveur)";
        else if (!this.params.reconciliation) this.params.info = "Désynchronisation possible";
        else this.params.info = "Fluide (Prédiction + Réconciliation)";
        this.infoCtrl.updateDisplay();
    }

    update() {
        const delta = 0.016;
        this.time += delta;

        // 1. CLIENT SIDE
        const moveDir = new THREE.Vector3().subVectors(this.targetPos, this.clientPosition);
        if (moveDir.length() > 0.1) {
            moveDir.normalize().multiplyScalar(0.2);
            
            // Store input for the server
            const input = { dir: moveDir.clone(), ts: this.time };
            this.inputQueue.push(input);

            // If prediction is ON, move immediately
            if (this.params.prediction) {
                this.clientPosition.add(moveDir);
            }
        }

        // 2. NETWORK SIMULATION (DELAY)
        // We simulate that the server receives and processes the input after 'latency' ms
        const latencyInSec = this.params.latency / 1000;
        
        // Find inputs that reached the server
        while (this.inputQueue.length > 0 && this.time - this.inputQueue[0].ts >= latencyInSec) {
            const processedInput = this.inputQueue.shift();
            this.serverPosition.add(processedInput.dir);

            // 3. SERVER RECONCILIATION
            if (!this.params.prediction) {
                // If no prediction, client just snaps to server position
                this.clientPosition.copy(this.serverPosition);
            } else if (this.params.reconciliation) {
                // If reconciliation is ON, we should check if our prediction matches server
                // Simplified: here we just show the visual gap
            }
        }

        this.clientPlayer.position.copy(this.clientPosition);
        this.serverGhost.position.copy(this.serverPosition);
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
        window.removeEventListener('pointerdown', this.onPointerDown);
    }
}
