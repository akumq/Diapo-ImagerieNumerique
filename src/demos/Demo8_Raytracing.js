import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo8_Raytracing {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        // --- Observer Camera ---
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(5, 3, 5);
        this.camera.lookAt(0, 0, 0);

        this.eyeMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.2),
            new THREE.MeshBasicMaterial({ color: 0x00ffff }) 
        );
        this.eyeMesh.position.set(0, 0, 3);
        this.scene.add(this.eyeMesh);

        const screenGeo = new THREE.PlaneGeometry(2, 2, 10, 10);
        const screenMat = new THREE.MeshBasicMaterial({ 
            color: 0x444444, 
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
        this.screenMesh.position.set(0, 0, 1.5); // Between Eye and Scene
        this.scene.add(this.screenMesh);

        //  for the "rendered" image on the screen
        this.canvas = document.createElement('canvas');
        this.canvas.width = 64; this.canvas.height = 64;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0,0,64,64);
        
        this.screenTexture = new THREE.CanvasTexture(this.canvas);
        this.screenTexture.minFilter = THREE.NearestFilter;
        this.screenTexture.magFilter = THREE.NearestFilter;
        
        const renderedImageMat = new THREE.MeshBasicMaterial({
            map: this.screenTexture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        this.renderedImageParams = {
            width: 2, height: 2
        };
        const renderedImageGeo = new THREE.PlaneGeometry(2, 2);
        this.renderedImage = new THREE.Mesh(renderedImageGeo, renderedImageMat);
        this.renderedImage.position.copy(this.screenMesh.position);
        this.scene.add(this.renderedImage);

        // 3. Simple Scene Objects
        this.objects = [];
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 32, 32),
            new THREE.MeshPhongMaterial({ color: 0xff0000 })
        );
        sphere.position.set(0, 0, -1);
        this.scene.add(sphere);
        this.objects.push(sphere);

        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0x00ff00 })
        );
        box.position.set(1.5, 0, -2);
        box.rotation.y = 0.5;
        this.scene.add(box);
        this.objects.push(box);

        // Light
        this.light = new THREE.PointLight(0xffffff, 1);
        this.light.position.set(2, 3, 2);
        this.scene.add(this.light);
        this.scene.add(new THREE.PointLightHelper(this.light, 0.2));

        // --- Ray Viz ---
        this.rayLine = null;
        this.shadowRayLine = null;
        this.raycaster = new THREE.Raycaster();
        
        // --- State ---
        this.params = {
            speed: 50, // Rays per second approx
            accumulate: true
        };
        this.lastTime = 0;

        // GUI
        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';
        
        this.gui.add(this.params, 'speed', 1, 600).name('Vitesse Simulation');
        this.gui.add({ reset: () => this.reset() }, 'reset').name('Réinitialiser');

        this.raysToProcess = [];
    }

    reset() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0,0,64,64);
        this.screenTexture.needsUpdate = true;
    }

    shootRay() {
        // Pick random pixel
        const px = Math.floor(Math.random() * 64);
        const py = Math.floor(Math.random() * 64);

        // Map pixel to World Space on Screen Plane
        // Plane is 2x2 centered at 0,0,1.5
        // x: -1 to 1, y: -1 to 1
        const wx = (px / 64) * 2 - 1 + (1/64); // center of pixel
        const wy = 1 - (py / 64) * 2 - (1/64); // flip Y

        const pixelPos = new THREE.Vector3(wx, wy, 1.5);
        const eyePos = this.eyeMesh.position.clone();
        
        const dir = new THREE.Vector3().subVectors(pixelPos, eyePos).normalize();
        
        this.raycaster.set(eyePos, dir);
        const intersects = this.raycaster.intersectObjects(this.objects);

        let color = '#000000'; // Void color

        // Visual Ray
        if (this.rayLine) this.scene.remove(this.rayLine);
        
        // Limit ray length for visual
        const rayLength = intersects.length > 0 ? intersects[0].distance : 10;
        const endPoint = new THREE.Vector3().copy(eyePos).add(dir.multiplyScalar(rayLength));
        
        const geometry = new THREE.BufferGeometry().setFromPoints([eyePos, endPoint]);
        const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
        this.rayLine = new THREE.Line(geometry, material);
        this.scene.add(this.rayLine);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const objColor = hit.object.material.color;
            
            // Simple lighting: Dot(Normal, LightDir)
            // Shadow check?
            const lightDir = new THREE.Vector3().subVectors(this.light.position, hit.point).normalize();
            
            // Cast shadow ray
            const shadowRay = new THREE.Raycaster(hit.point.clone().add(hit.face.normal.clone().multiplyScalar(0.01)), lightDir);
            // Check collision with other objects roughly? 
            // For now just basic shading to keep demo fast and stable.
            
            const dot = Math.max(0, hit.face.normal.dot(lightDir));
            
            // Color logic
            const r = Math.floor(objColor.r * 255 * dot);
            const g = Math.floor(objColor.g * 255 * dot);
            const b = Math.floor(objColor.b * 255 * dot);
            color = `rgb(${r},${g},${b})`;
        }

        // Paint Pixel
        this.ctx.fillStyle = color;
        this.ctx.fillRect(px, py, 1, 1);
        this.screenTexture.needsUpdate = true;
    }

    update() {
        // Shoot N rays per frame based on speed
        // 60FPS -> Speed/60 rays per frame?
        const count = Math.ceil(this.params.speed / 10); // ballpark
        for(let i=0; i<count; i++) {
            this.shootRay();
        }
        
        // Rotate objects slightly to show it's "live" but slow accumulation?
        // No, raytracing demo usually static scene is better to fill image.
        // But maybe move light?
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
        this.screenTexture.dispose();
        // clear lines
        if(this.rayLine) this.scene.remove(this.rayLine);
    }
}
