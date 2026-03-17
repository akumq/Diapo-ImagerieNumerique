import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo8_Raytracing {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);

        // Observer Camera
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(5, 3, 5);
        this.camera.lookAt(0, 0, 0);

        // Simulated Eye/Camera position
        this.eyeMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.2),
            new THREE.MeshBasicMaterial({ color: 0x00ffff }) 
        );
        this.eyeMesh.position.set(0, 0, 3);
        this.scene.add(this.eyeMesh);

        // Projection screen
        const screenGeo = new THREE.PlaneGeometry(2, 2, 10, 10);
        const screenMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            wireframe: true,
            transparent: false,
            opacity: 1.0
        });
        this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
        this.screenMesh.position.set(0, 0, 1.5);
        this.scene.add(this.screenMesh);

        // Raytracing accumulation canvas
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
        this.renderedImageParams = { width: 2, height: 2 };
        const renderedImageGeo = new THREE.PlaneGeometry(2, 2);
        this.renderedImage = new THREE.Mesh(renderedImageGeo, renderedImageMat);
        this.renderedImage.position.copy(this.screenMesh.position);
        this.scene.add(this.renderedImage);

        // Scene Objects
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

        // Point Light
        this.light = new THREE.PointLight(0xffffff, 1);
        this.light.position.set(2, 3, 2);
        this.scene.add(this.light);
        this.scene.add(new THREE.PointLightHelper(this.light, 0.2));

        // Ray Visualization
        this.rayLine = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        this.rayLine.visible = false;
        this.scene.add(this.rayLine);

        this.raycaster = new THREE.Raycaster();
        
        // Raytracing state
        this.params = {
            speed: 50,
            accumulate: true
        };
        this.lastTime = 0;

        // GUI
        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';
        
        this.gui.add(this.params, 'speed', 1, 600).name('Rays/Frame');
        this.gui.add({ reset: () => this.reset() }, 'reset').name('Reset');
    }

    reset() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0,0,64,64);
        this.screenTexture.needsUpdate = true;
    }

    shootRay() {
        // Random pixel sampling
        const px = Math.floor(Math.random() * 64);
        const py = Math.floor(Math.random() * 64);

        // Map pixel to World Space on Screen Plane
        const wx = (px / 64) * 2 - 1 + (1/64);
        const wy = 1 - (py / 64) * 2 - (1/64);

        const pixelPos = new THREE.Vector3(wx, wy, 1.5);
        const eyePos = this.eyeMesh.position.clone();
        const dir = new THREE.Vector3().subVectors(pixelPos, eyePos).normalize();
        
        this.raycaster.set(eyePos, dir);
        const intersects = this.raycaster.intersectObjects(this.objects);

        let color = '#000000';

        // Visualization
        const rayLength = intersects.length > 0 ? intersects[0].distance : 10;
        const endPoint = new THREE.Vector3().copy(eyePos).add(dir.multiplyScalar(rayLength));
        this.rayLine.geometry.setFromPoints([eyePos, endPoint]);
        this.rayLine.visible = true;

        if (intersects.length > 0) {
            const hit = intersects[0];
            const objColor = hit.object.material.color;
            
            // Basic Lambertian shading
            const worldNormal = hit.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld));
            const lightDir = new THREE.Vector3().subVectors(this.light.position, hit.point).normalize();
            const dot = Math.max(0, worldNormal.dot(lightDir));
            
            const r = Math.floor(objColor.r * 255 * dot);
            const g = Math.floor(objColor.g * 255 * dot);
            const b = Math.floor(objColor.b * 255 * dot);
            color = `rgb(${r},${g},${b})`;
        }

        this.ctx.fillStyle = color;
        this.ctx.fillRect(px, py, 1, 1);
        this.screenTexture.needsUpdate = true;
    }

    update() {
        const count = Math.ceil(this.params.speed / 10); 
        for(let i=0; i<count; i++) {
            this.shootRay();
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
        this.screenTexture.dispose();
        
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
