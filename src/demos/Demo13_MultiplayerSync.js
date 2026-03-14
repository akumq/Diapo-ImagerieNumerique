import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo13_MultiplayerSync {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);

        this.views = [
            { left: 0, bottom: 0.66, width: 1.0, height: 0.34, background: new THREE.Color(0x0a0505), label: 'SERVEUR (VÉRITÉ)' },
            { left: 0, bottom: 0.33, width: 1.0, height: 0.33, background: new THREE.Color(0x050a05), label: 'CLIENT A (BRUT)' },
            { left: 0, bottom: 0, width: 1.0, height: 0.33, background: new THREE.Color(0x05050a), label: 'CLIENT B (INTERPOLÉ)' }
        ];

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(0, 5, 8);
        this.camera.lookAt(0, 0, 0);

        this.scene.add(new THREE.GridHelper(20, 20, 0x333333, 0x222222));
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const light = new THREE.PointLight(0xffffff, 50);
        light.position.set(0, 10, 0);
        this.scene.add(light);

        const geom = new THREE.SphereGeometry(0.5, 32, 32);
        
        this.serverObj = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
        this.clientAObj = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0xff4444 }));
        this.clientBObj = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x44ff44 }));

        this.scene.add(this.serverObj);
        this.scene.add(this.clientAObj);
        this.scene.add(this.clientBObj);

        this.params = {
            tickRate: 10,
            latency: 200,
            jitter: 50,
            interpDelay: 100,
            info: 'Simulation de Synchronisation'
        };

        this.serverPos = new THREE.Vector3();
        this.snapshotsA = [];
        this.snapshotsB = [];
        this.lastTickTime = 0;
        this.clock = new THREE.Clock();

        this.gui = new GUI({ container: document.getElementById('workbench-container') });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        this.gui.add(this.params, 'tickRate', 1, 60, 1).name('Updates / sec');
        this.gui.add(this.params, 'latency', 0, 1000).name('Latence (ms)');
        this.gui.add(this.params, 'jitter', 0, 200).name('Jitter');
        this.gui.add(this.params, 'interpDelay', 0, 500).name('Interp. Buffer (ms)');

        this.createLabels();
    }

    createLabels() {
        this.labelContainer = document.createElement('div');
        this.labelContainer.style.position = 'absolute';
        this.labelContainer.style.top = '0';
        this.labelContainer.style.left = '0';
        this.labelContainer.style.width = '100%';
        this.labelContainer.style.height = '100%';
        this.labelContainer.style.display = 'flex';
        this.labelContainer.style.flexDirection = 'column';
        this.labelContainer.style.pointerEvents = 'none';
        
        this.views.forEach(v => {
            const label = document.createElement('div');
            label.style.flex = '1';
            label.style.textAlign = 'left';
            label.style.padding = '10px';
            label.style.color = '#fff';
            label.style.fontFamily = 'monospace';
            label.style.fontSize = '12px';
            label.style.borderBottom = '1px solid #333';
            label.innerHTML = v.label;
            this.labelContainer.appendChild(label);
        });
        document.getElementById('workbench-container').appendChild(this.labelContainer);
    }

    update() {
        const now = performance.now();
        const time = now * 0.001;
        
        this.serverPos.x = Math.sin(time * 2) * 3;
        this.serverPos.z = Math.cos(time * 3) * 2;
        this.serverPos.y = Math.abs(Math.sin(time * 4)) * 2 + 0.5;
        this.serverObj.position.copy(this.serverPos);

        if (time - this.lastTickTime > (1 / this.params.tickRate)) {
            const snapshot = { pos: this.serverPos.clone(), ts: now };
            const send = (buf) => {
                const delay = this.params.latency + (Math.random() - 0.5) * this.params.jitter;
                setTimeout(() => { 
                    buf.push(snapshot); 
                    if(buf.length > 50) buf.shift(); 
                }, delay);
            };
            send(this.snapshotsA);
            send(this.snapshotsB);
            this.lastTickTime = time;
        }

        if (this.snapshotsA.length > 0) {
            this.clientAObj.position.copy(this.snapshotsA[this.snapshotsA.length - 1].pos);
        }

        const renderTime = now - this.params.latency - this.params.interpDelay;
        if (this.snapshotsB.length >= 2) {
            let s0 = null, s1 = null;
            for (let i = 0; i < this.snapshotsB.length - 1; i++) {
                if (this.snapshotsB[i].ts <= renderTime && this.snapshotsB[i+1].ts >= renderTime) {
                    s0 = this.snapshotsB[i];
                    s1 = this.snapshotsB[i+1];
                    break;
                }
            }

            if (s0 && s1) {
                const t = (renderTime - s0.ts) / (s1.ts - s0.ts);
                this.clientBObj.position.lerpVectors(s0.pos, s1.pos, t);
            } else if (renderTime > this.snapshotsB[this.snapshotsB.length - 1].ts) {
                this.clientBObj.position.copy(this.snapshotsB[this.snapshotsB.length - 1].pos);
            }
        }
    }

    render(renderer) {
        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.views.forEach(v => {
            const left = v.left * size.x;
            const bottom = v.bottom * size.y;
            const width = v.width * size.x;
            const height = v.height * size.y;

            renderer.setViewport(left, bottom, width, height);
            renderer.setScissor(left, bottom, width, height);
            renderer.setScissorTest(true);

            this.serverObj.visible = (v.label === 'SERVEUR (VÉRITÉ)');
            this.clientAObj.visible = (v.label === 'CLIENT A (BRUT)');
            this.clientBObj.visible = (v.label === 'CLIENT B (INTERPOLÉ)');

            renderer.render(this.scene, this.camera);
        });
    }

    onResize(width, height) {
        this.camera.aspect = width / (height / 3);
        this.camera.updateProjectionMatrix();
    }

    dispose() {
        this.gui.destroy();
        if (this.labelContainer) this.labelContainer.remove();
        this.renderer.setScissorTest(false);
        this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    }
}
