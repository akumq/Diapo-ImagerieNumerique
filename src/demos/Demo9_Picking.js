import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo9_Picking {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        // --- Observer Camera (Global View) ---
        this.mainCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.mainCamera.position.set(5, 5, 8);
        this.mainCamera.lookAt(0, 0, 0);

        // --- Virtual Camera (Simulated User) ---
        this.virtualCamera = new THREE.PerspectiveCamera(40, 1.6, 2, 20);
        this.virtualCamera.position.set(0, 0, 4);
        this.virtualCamera.lookAt(0, 0, -5);
        this.virtualCamera.updateMatrixWorld();
        this.virtualCamera.updateProjectionMatrix();

        // Visual Representation of Virtual Camera
        this.cameraHelper = new THREE.CameraHelper(this.virtualCamera);
        this.scene.add(this.cameraHelper);

        const camMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 1),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        camMesh.position.copy(this.virtualCamera.position);
        camMesh.quaternion.copy(this.virtualCamera.quaternion);
        this.scene.add(camMesh);

        // --- Screen Plane (The "Monitor") ---
        // Situated at the near plane of the virtual camera
        const near = this.virtualCamera.near;
        const fov = THREE.MathUtils.degToRad(this.virtualCamera.fov);
        const height = 2 * near * Math.tan(fov / 2);
        const width = height * this.virtualCamera.aspect;

        const screenGeo = new THREE.PlaneGeometry(width, height);
        // Semi-transparent grid screen
        const screenMat = new THREE.MeshBasicMaterial({ 
            color: 0x00aaff, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.2,
            wireframe: false
        });
        this.screenPlane = new THREE.Mesh(screenGeo, screenMat);
        
        // Attach screen to camera mesh logic or scene? 
        // For visualization simplicity, let's keep it in world space but synced.
        this.screenPlane.position.copy(this.virtualCamera.position);
        this.screenPlane.quaternion.copy(this.virtualCamera.quaternion);
        this.screenPlane.translateZ(-near);
        this.scene.add(this.screenPlane);

        // Add a wireframe border to the screen
        const wireGeo = new THREE.EdgesGeometry(screenGeo);
        const wireMat = new THREE.LineBasicMaterial({ color: 0x00aaff });
        const screenWire = new THREE.LineSegments(wireGeo, wireMat);
        this.screenPlane.add(screenWire);

        // --- Mouse Marker (The red dot on the screen) ---
        this.mouseMarker = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        this.screenPlane.add(this.mouseMarker); // Attached to screen plane, local coords

        // --- The Ray (Visual Line) ---
        // Line from Camera Eye -> Mouse Marker -> World
        const rayGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-10)]);
        this.rayLine = new THREE.Line(rayGeo, new THREE.LineBasicMaterial({ color: 0xffaa00 }));
        this.scene.add(this.rayLine);

        // --- Target Objects ---
        this.objects = [];
        const geometry = new THREE.IcosahedronGeometry(0.5, 1);
        
        for (let i = 0; i < 8; i++) {
            const material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
            const mesh = new THREE.Mesh(geometry, material);
            
            // Random positions in view of virtual camera
            mesh.position.x = (Math.random() - 0.5) * 4;
            mesh.position.y = (Math.random() - 0.5) * 3;
            mesh.position.z = -2 - Math.random() * 3; // In front of cam
            
            mesh.userData.originalColor = material.color.clone();
            this.scene.add(mesh);
            this.objects.push(mesh);
        }

        // --- Lighting ---
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 5);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

        // --- State ---
        this.mouse = new THREE.Vector2(); // NDC
        this.raycaster = new THREE.Raycaster();
        this.intersected = null;

        // Interaction
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

        // Helper: Grid in world
        const grid = new THREE.GridHelper(20, 20);
        grid.position.y = -2;
        this.scene.add(grid);
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    updateView() {
        // Just logic flag, render handles specific camera
    }

    update() {
        // 1. Update Mouse Marker on Screen Plane
        // NDC (mouse) -> Screen Plane Local Coords
        // Plane is width x height. 
        // NDC x (-1 to 1) -> Plane x (-width/2 to width/2)
        const near = this.virtualCamera.near;
        const fov = THREE.MathUtils.degToRad(this.virtualCamera.fov);
        const height = 2 * near * Math.tan(fov / 2);
        const width = height * this.virtualCamera.aspect;

        // Note: Mouse Y is up, Plane Y is up. NDC matches Plane orientation.
        // BUT: Normalized Device Coords usually match the rendered view. 
        // If we want the Physical Mouse to map to the Virtual Screen, we assume the user "is" the virtual camera.
        
        this.mouseMarker.position.x = this.mouse.x * (width / 2);
        this.mouseMarker.position.y = this.mouse.y * (height / 2);
        
        // 2. Raycast from Virtual Camera
        this.raycaster.setFromCamera(this.mouse, this.virtualCamera);
        
        // 3. Update Visual Ray
        // Start: Virtual Camera Eye
        const start = this.virtualCamera.position.clone();
        // End: Ray direction far out
        const direction = this.raycaster.ray.direction.clone();
        
        // Check intersections
        const intersects = this.raycaster.intersectObjects(this.objects);
        
        let endDist = 20; // Default ray length
        let hitObject = null;

        if (intersects.length > 0) {
            endDist = intersects[0].distance;
            hitObject = intersects[0].object;
        }

        const end = start.clone().add(direction.multiplyScalar(endDist));
        
        this.rayLine.geometry.setFromPoints([start, end]);

        // 4. Highlight Logic
        if (this.intersected && this.intersected !== hitObject) {
            this.intersected.material.emissive.setHex(0x000000); // Reset old
        }
        
        if (hitObject) {
            this.intersected = hitObject;
            this.intersected.material.emissive.setHex(0xff0000); // Highlight new
            this.params.hint = "Intersection !";
        } else {
            this.intersected = null;
            this.params.hint = "Rayon vide...";
        }

        // Animate objects slightly
        this.objects.forEach(o => o.rotation.y += 0.01);

        // Update Camera Helper
        this.cameraHelper.update();
    }

    render(renderer) {
        if (this.params.view === 'Virtual Camera') {
            // Render what the virtual camera sees (Normal mode)
            // Need to hide helper to avoid artifact?
            this.cameraHelper.visible = false;
            this.rayLine.visible = false; 
            this.screenPlane.visible = false; // Hide the "physical" screen
            renderer.render(this.scene, this.virtualCamera);
            
            // Restore visibility
            this.cameraHelper.visible = true;
            this.rayLine.visible = true; 
            this.screenPlane.visible = true;
        } else {
            // Observer View
            renderer.render(this.scene, this.mainCamera);
        }
    }

    onResize(width, height) {
        // Main Observer Camera
        this.mainCamera.aspect = width / height;
        this.mainCamera.updateProjectionMatrix();

        // Virtual Camera typically has fixed aspect ratio for demo purposes?
        // Or matches screen. Let's make it match screen to simulate "User Screen".
        this.virtualCamera.aspect = width / height;
        this.virtualCamera.updateProjectionMatrix();
        this.cameraHelper.update();

        // Update Screen Plane Dimension
        const near = this.virtualCamera.near;
        const fov = THREE.MathUtils.degToRad(this.virtualCamera.fov);
        const h = 2 * near * Math.tan(fov / 2);
        const w = h * this.virtualCamera.aspect;
        this.screenPlane.geometry.dispose();
        this.screenPlane.geometry = new THREE.PlaneGeometry(w, h);
    }

    dispose() {
        this.gui.destroy();
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        // dispose geometries/materials
    }
}
