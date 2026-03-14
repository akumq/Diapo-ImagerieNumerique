import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo9_Picking {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        // Observer Camera
        this.mainCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.mainCamera.position.set(5, 5, 8);
        this.mainCamera.lookAt(0, 0, 0);

        // Virtual Camera
        this.virtualCamera = new THREE.PerspectiveCamera(40, 1.6, 2, 20);
        this.virtualCamera.position.set(0, 0, 4);
        this.virtualCamera.lookAt(0, 0, -5);
        this.virtualCamera.updateMatrixWorld();
        this.virtualCamera.updateProjectionMatrix();

        this.cameraHelper = new THREE.CameraHelper(this.virtualCamera);
        this.scene.add(this.cameraHelper);

        const camMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 1),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        camMesh.position.copy(this.virtualCamera.position);
        camMesh.quaternion.copy(this.virtualCamera.quaternion);
        this.scene.add(camMesh);

        // Screen plane setup
        const near = this.virtualCamera.near;
        const fov = THREE.MathUtils.degToRad(this.virtualCamera.fov);
        const height = 2 * near * Math.tan(fov / 2);
        const width = height * this.virtualCamera.aspect;

        const screenGeo = new THREE.PlaneGeometry(width, height);
        const screenMat = new THREE.MeshBasicMaterial({ 
            color: 0x00aaff, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.2
        });
        this.screenPlane = new THREE.Mesh(screenGeo, screenMat);
        
        this.screenPlane.position.copy(this.virtualCamera.position);
        this.screenPlane.quaternion.copy(this.virtualCamera.quaternion);
        this.screenPlane.translateZ(-near);
        this.scene.add(this.screenPlane);

        const wireGeo = new THREE.EdgesGeometry(screenGeo);
        const wireMat = new THREE.LineBasicMaterial({ color: 0x00aaff });
        const screenWire = new THREE.LineSegments(wireGeo, wireMat);
        this.screenPlane.add(screenWire);

        // Mouse marker
        this.mouseMarker = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        this.screenPlane.add(this.mouseMarker);

        // Ray visualization
        const rayGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-10)]);
        this.rayLine = new THREE.Line(rayGeo, new THREE.LineBasicMaterial({ color: 0xffaa00 }));
        this.scene.add(this.rayLine);

        // Target objects
        this.objects = [];
        const geometry = new THREE.IcosahedronGeometry(0.5, 1);
        
        for (let i = 0; i < 8; i++) {
            const material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.x = (Math.random() - 0.5) * 4;
            mesh.position.y = (Math.random() - 0.5) * 3;
            mesh.position.z = -2 - Math.random() * 3;
            
            mesh.userData.originalColor = material.color.clone();
            this.scene.add(mesh);
            this.objects.push(mesh);
        }

        // Lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 5);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

        // Interaction state
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.intersected = null;

        this.onMouseMove = this.onMouseMove.bind(this);
        this.canvas = this.renderer.domElement;
        this.canvas.addEventListener('mousemove', this.onMouseMove);

        // GUI
        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';
        
        this.params = {
            view: 'Observer',
            hint: 'Bougez la souris !'
        };

        this.gui.add(this.params, 'view', ['Observer', 'Virtual Camera']).name('Vue').onChange(() => this.updateView());
        this.gui.add(this.params, 'hint').name('Info').disable();

        const grid = new THREE.GridHelper(20, 20);
        grid.position.y = -2;
        this.scene.add(grid);
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    updateView() {}

    update() {
        // Map NDC to screen plane local coordinates
        const near = this.virtualCamera.near;
        const fov = THREE.MathUtils.degToRad(this.virtualCamera.fov);
        const height = 2 * near * Math.tan(fov / 2);
        const width = height * this.virtualCamera.aspect;

        this.mouseMarker.position.x = this.mouse.x * (width / 2);
        this.mouseMarker.position.y = this.mouse.y * (height / 2);
        
        // Picking logic
        this.raycaster.setFromCamera(this.mouse, this.virtualCamera);
        
        const start = this.virtualCamera.position.clone();
        const direction = this.raycaster.ray.direction.clone();
        const intersects = this.raycaster.intersectObjects(this.objects);
        
        let endDist = 20;
        let hitObject = null;

        if (intersects.length > 0) {
            endDist = intersects[0].distance;
            hitObject = intersects[0].object;
        }

        const end = start.clone().add(direction.multiplyScalar(endDist));
        this.rayLine.geometry.setFromPoints([start, end]);

        // Selection highlight
        if (this.intersected && this.intersected !== hitObject) {
            this.intersected.material.emissive.setHex(0x000000);
        }
        
        if (hitObject) {
            this.intersected = hitObject;
            this.intersected.material.emissive.setHex(0xff0000);
            this.params.hint = "Intersection !";
        } else {
            this.intersected = null;
            this.params.hint = "Rayon vide...";
        }

        this.objects.forEach(o => o.rotation.y += 0.01);
        this.cameraHelper.update();
    }

    render(renderer) {
        if (this.params.view === 'Virtual Camera') {
            this.cameraHelper.visible = false;
            this.rayLine.visible = false; 
            this.screenPlane.visible = false;
            renderer.render(this.scene, this.virtualCamera);
            this.cameraHelper.visible = true;
            this.rayLine.visible = true; 
            this.screenPlane.visible = true;
        } else {
            renderer.render(this.scene, this.mainCamera);
        }
    }

    onResize(width, height) {
        this.mainCamera.aspect = width / height;
        this.mainCamera.updateProjectionMatrix();

        this.virtualCamera.aspect = width / height;
        this.virtualCamera.updateProjectionMatrix();
        this.cameraHelper.update();

        const near = this.virtualCamera.near;
        const fov = THREE.MathUtils.degToRad(this.virtualCamera.fov);
        const h = 2 * near * Math.tan(fov / 2);
        const w = h * this.virtualCamera.aspect;
        
        this.screenPlane.geometry.dispose();
        this.screenPlane.geometry = new THREE.PlaneGeometry(w, h);
        
        const screenWire = this.screenPlane.children.find(c => c instanceof THREE.LineSegments);
        if (screenWire) {
            screenWire.geometry.dispose();
            screenWire.geometry = new THREE.EdgesGeometry(this.screenPlane.geometry);
        }
    }

    dispose() {
        this.gui.destroy();
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        
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
